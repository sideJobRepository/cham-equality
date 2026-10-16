# App Store Connect API 로 iOS 출시를 다룬다. app-promote-ios.yaml 이 부른다.
#
#   ruby app-store.rb <submit|release|pause|resume|complete|status>
#
# fastlane deliver 대신 API 를 직접 부른다. deliver 는 메타데이터를 건너뛰면(skip_metadata)
# 출시 방식(수동/자동)·단계적 출시 설정까지 같이 건너뛰어서, 메타데이터를 ASC 화면에서 관리하는
# 우리 방식과 맞지 않는다.
require 'json'
require 'net/http'
require 'openssl'
require 'jwt'

BUNDLE_ID = 'kr.or.cham.equality'
API = 'https://api.appstoreconnect.apple.com'

# 심사에 다시 낼 수 있는(수정 가능한) 버전 상태. 한 앱에 이런 버전은 하나만 있다.
EDITABLE = %w[PREPARE_FOR_SUBMISSION DEVELOPER_REJECTED REJECTED METADATA_REJECTED INVALID_BINARY].freeze
IN_FLIGHT = %w[WAITING_FOR_REVIEW IN_REVIEW PENDING_DEVELOPER_RELEASE].freeze

def summary(line)
  puts line
  File.write(ENV['GITHUB_STEP_SUMMARY'], "#{line}\n", mode: 'a') if ENV['GITHUB_STEP_SUMMARY']
end

def token
  @token ||= begin
    key = OpenSSL::PKey::EC.new(File.read(ENV.fetch('ASC_KEY_PATH')))
    now = Time.now.to_i
    payload = { iss: ENV.fetch('ASC_ISSUER_ID'), iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' }
    JWT.encode(payload, key, 'ES256', { kid: ENV.fetch('ASC_KEY_ID') })
  end
end

# missing_ok: 관계가 비어 있을 때 404 를 주는 엔드포인트(단계적 출시 조회 등)용.
def call(method, path, params: {}, body: nil, missing_ok: false)
  uri = URI(API + path)
  uri.query = URI.encode_www_form(params) unless params.empty?
  req = Net::HTTP.const_get(method.capitalize).new(uri)
  req['Authorization'] = "Bearer #{token}"
  if body
    req['Content-Type'] = 'application/json'
    req.body = JSON.generate(body)
  end
  res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.request(req) }
  return nil if missing_ok && res.code == '404'
  # 메타데이터 누락 같은 심사 제출 거부도 여기서 그대로 보인다(errors[].detail 에 무엇이 빠졌는지 나온다).
  abort "#{method} #{path} 실패 (#{res.code})\n#{res.body}" unless res.is_a?(Net::HTTPSuccess)
  res.body.to_s.empty? ? nil : JSON.parse(res.body)
end

def ref(type, id)
  { data: { type: type, id: id } }
end

def app_id
  @app_id ||= call('GET', '/v1/apps', params: { 'filter[bundleId]' => BUNDLE_ID })['data'].first&.dig('id') ||
              abort("App Store Connect 에 #{BUNDLE_ID} 앱이 없습니다")
end

def versions(states = nil)
  params = { 'filter[platform]' => 'IOS', 'limit' => 10 }
  params['filter[appStoreState]'] = states.join(',') if states
  call('GET', "/v1/apps/#{app_id}/appStoreVersions", params: params)['data']
end

def phased_release_of(version_id)
  call('GET', "/v1/appStoreVersions/#{version_id}/appStoreVersionPhasedRelease", missing_ok: true)&.dig('data')
end

# 번호를 비우면 가장 최근에 올라간 빌드.
def find_build(number)
  params = { 'filter[app]' => app_id, 'filter[preReleaseVersion.platform]' => 'IOS',
             'include' => 'preReleaseVersion', 'limit' => 1 }
  if number.empty?
    params['sort'] = '-uploadedDate'
  else
    params['filter[version]'] = number
  end
  res = call('GET', '/v1/builds', params: params)
  build = res['data'].first or abort("빌드를 찾을 수 없습니다: #{number.empty? ? '(최신)' : number}")
  version_string = res['included'].find { |i| i['type'] == 'preReleaseVersions' }.dig('attributes', 'version')
  [build, version_string]
end

def submit
  build, version_string = find_build(ENV['BUILD_NUMBER'].to_s)
  attrs = build['attributes']
  abort "빌드 #{attrs['version']} 은 아직 처리 중이거나 실패했습니다(#{attrs['processingState']}). TestFlight 에서 확인하세요" unless attrs['processingState'] == 'VALID'
  abort "빌드 #{attrs['version']} 은 만료됐습니다" if attrs['expired']

  busy = versions(IN_FLIGHT).first
  if busy
    abort "이미 #{busy.dig('attributes', 'versionString')} 이(가) #{busy.dig('attributes', 'appStoreState')} 상태입니다. " \
          '출시 대기면 release 로 내보내고, 심사 중이면 App Store Connect 에서 취소한 뒤 다시 실행하세요'
  end

  release_type = ENV['RELEASE_AFTER_APPROVAL'] == 'true' ? 'AFTER_APPROVAL' : 'MANUAL'
  version_attrs = { versionString: version_string, releaseType: release_type }
  editable = versions(EDITABLE).first
  version =
    if editable
      call('PATCH', "/v1/appStoreVersions/#{editable['id']}",
           body: { data: { type: 'appStoreVersions', id: editable['id'], attributes: version_attrs } })['data']
    else
      call('POST', '/v1/appStoreVersions',
           body: { data: { type: 'appStoreVersions', attributes: version_attrs.merge(platform: 'IOS'),
                           relationships: { app: ref('apps', app_id) } } })['data']
    end
  version_id = version['id']

  call('PATCH', "/v1/appStoreVersions/#{version_id}/relationships/build", body: ref('builds', build['id']))

  # 단계적 출시는 업데이트에만 된다. 첫 출시(판매 중인 버전이 없음)면 애플이 거부하므로 건너뛴다.
  want_phased = ENV['PHASED'] == 'true' && versions(['READY_FOR_SALE']).any?
  phased = phased_release_of(version_id)
  if want_phased && !phased
    call('POST', '/v1/appStoreVersionPhasedReleases',
         body: { data: { type: 'appStoreVersionPhasedReleases', attributes: { phasedReleaseState: 'INACTIVE' },
                         relationships: { appStoreVersion: ref('appStoreVersions', version_id) } } })
  elsif !want_phased && phased
    call('DELETE', "/v1/appStoreVersionPhasedReleases/#{phased['id']}")
  end

  # 제출 묶음(reviewSubmission)이 열려 있으면 재사용한다. 새로 만들면 '이미 있음' 으로 거부된다.
  submission = call('GET', '/v1/reviewSubmissions',
                    params: { 'filter[app]' => app_id, 'filter[platform]' => 'IOS',
                              'filter[state]' => 'READY_FOR_REVIEW' })['data'].first
  submission ||= call('POST', '/v1/reviewSubmissions',
                      body: { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' },
                                      relationships: { app: ref('apps', app_id) } } })['data']
  items = call('GET', "/v1/reviewSubmissions/#{submission['id']}/items", params: { 'include' => 'appStoreVersion' })['data']
  unless items.any? { |i| i.dig('relationships', 'appStoreVersion', 'data', 'id') == version_id }
    call('POST', '/v1/reviewSubmissionItems',
         body: { data: { type: 'reviewSubmissionItems',
                         relationships: { reviewSubmission: ref('reviewSubmissions', submission['id']),
                                          appStoreVersion: ref('appStoreVersions', version_id) } } })
  end
  call('PATCH', "/v1/reviewSubmissions/#{submission['id']}",
       body: { data: { type: 'reviewSubmissions', id: submission['id'], attributes: { submitted: true } } })

  summary "### 심사 제출"
  summary "- 버전 `#{version_string}` (빌드 #{attrs['version']})"
  summary "- 승인 후: #{release_type == 'MANUAL' ? '대기 → release 로 직접 출시' : '바로 출시'}"
  summary "- 단계적 출시: #{want_phased ? '켬 (7일)' : (ENV['PHASED'] == 'true' ? '첫 출시라 건너뜀' : '끔')}"
end

def release
  version = versions(['PENDING_DEVELOPER_RELEASE']).first or
            abort '출시 대기(승인 완료) 버전이 없습니다. status 로 상태를 확인하세요'
  call('POST', '/v1/appStoreVersionReleaseRequests',
       body: { data: { type: 'appStoreVersionReleaseRequests',
                       relationships: { appStoreVersion: ref('appStoreVersions', version['id']) } } })
  summary "### 출시: `#{version.dig('attributes', 'versionString')}`"
end

# pause=PAUSED / resume=ACTIVE / complete=COMPLETE. 판매 중인 버전의 단계적 출시만 대상이다.
def set_phased(state)
  version = versions(['READY_FOR_SALE']).first or abort '판매 중인 버전이 없습니다'
  phased = phased_release_of(version['id']) or abort '판매 중인 버전이 단계적 출시가 아닙니다'
  call('PATCH', "/v1/appStoreVersionPhasedReleases/#{phased['id']}",
       body: { data: { type: 'appStoreVersionPhasedReleases', id: phased['id'], attributes: { phasedReleaseState: state } } })
  summary "### 단계적 출시 #{state}: `#{version.dig('attributes', 'versionString')}`"
end

def status
  summary '### App Store 버전'
  versions.each do |v|
    a = v['attributes']
    line = "- `#{a['versionString']}` #{a['appStoreState']} (#{a['releaseType']})"
    if a['appStoreState'] == 'READY_FOR_SALE' && (phased = phased_release_of(v['id']))
      pa = phased['attributes']
      line += " — 단계적 출시 #{pa['phasedReleaseState']} #{pa['currentDayNumber']}일차"
    end
    summary line
  end
  summary '### 최근 TestFlight 빌드'
  res = call('GET', '/v1/builds', params: { 'filter[app]' => app_id, 'sort' => '-uploadedDate', 'limit' => 5,
                                            'include' => 'preReleaseVersion' })
  res['data'].each do |b|
    pre_id = b.dig('relationships', 'preReleaseVersion', 'data', 'id')
    version_string = (res['included'] || []).find { |i| i['id'] == pre_id }&.dig('attributes', 'version')
    summary "- 빌드 #{b.dig('attributes', 'version')} (`#{version_string}`) #{b.dig('attributes', 'processingState')}"
  end
end

case ARGV[0]
when 'submit' then submit
when 'release' then release
when 'pause' then set_phased('PAUSED')
when 'resume' then set_phased('ACTIVE')
when 'complete' then set_phased('COMPLETE')
when 'status' then status
else abort "알 수 없는 동작: #{ARGV[0]}"
end
