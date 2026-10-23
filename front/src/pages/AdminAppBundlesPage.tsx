import { useCallback, useState } from 'react'
import {
  fetchAppBundles,
  promoteAppBundles,
  setAppBundleEnabled,
  type AppBundle,
  type AppBundlePlatform,
} from '@/api/adminApi'
import { useAdminRequest } from '@/hooks/useAdminRequest'
import { useFeedback } from '@/hooks/useFeedback'
import { usePagedList } from '@/hooks/usePagedList'
import './AdminReportsPage.css'
import './AdminAppBundlesPage.css'

// 최근 몇 건까지 보여줄지. 서버는 1~100으로 자른다.
const BUNDLE_LIMIT = 50

const PLATFORM_LABEL: Record<AppBundlePlatform, string> = {
  ANDROID: '안드로이드',
  IOS: 'iOS',
}

// 화면에서 uuid는 뒤 8자리만 보여준다(앱 더보기의 버전 줄과 같은 표기).
const UUID_TAIL_LENGTH = 8
const COMMIT_SHORT_LENGTH = 7

function uuidTail(uuid: string): string {
  return uuid.slice(-UUID_TAIL_LENGTH)
}

function isTesterOnly(bundle: AppBundle): boolean {
  return bundle.channel === 'ALPHA' && bundle.enabled
}

/**
 * 앱 JS 번들(OTA) 관리. CI가 올린 번들은 테스터 채널(ALPHA)로 시작하고,
 * 여기서 "전체 공개"하면 PRODUCTION이 되어 모든 사용자에게 간다(GitHub Actions promote-ota와 같은 API).
 * 번들 등록은 CI 전용이라 이 화면에 없다.
 */
export default function AdminAppBundlesPage() {
  const { run } = useAdminRequest()
  const { toast, confirm } = useFeedback()
  // 처리 중인 동작. 끝날 때까지 다른 버튼을 막아 같은 번들에 요청이 겹치지 않게 한다.
  const [busyAction, setBusyAction] = useState<'promote' | string | null>(null)

  const fetchBundles = useCallback(() => fetchAppBundles(BUNDLE_LIMIT), [])
  const { data, loading, error, reload } = usePagedList(fetchBundles, '번들 목록을 불러오지 못했습니다')

  const testerOnlyCount = data ? data.filter(isTesterOnly).length : 0

  const handlePromote = async () => {
    const confirmed = await confirm({
      title: '테스터 번들 전체 공개',
      description:
        `테스터에게만 가던 번들(채널 ALPHA·켜짐)을 모두 전체 사용자에게 공개합니다. ` +
        `목록에 보이는 대상은 ${testerOnlyCount}건입니다(최근 ${BUNDLE_LIMIT}건 밖의 번들도 함께 공개됩니다). ` +
        `공개를 되돌리는 기능은 없고, 문제가 생기면 그 번들을 꺼야 합니다.`,
      confirmLabel: '전체 공개',
      destructive: true,
    })
    if (!confirmed) return
    setBusyAction('promote')
    const result = await run(promoteAppBundles(), '전체 공개에 실패했습니다')
    setBusyAction(null)
    if (!result.ok) {
      if (result.message) toast(result.message, 'error')
      return
    }
    toast(
      result.data.length > 0
        ? `번들 ${result.data.length}건을 전체 사용자에게 공개했습니다.`
        : '공개할 테스터 번들이 없었습니다.',
      result.data.length > 0 ? 'success' : 'info',
    )
    reload()
  }

  const handleToggle = async (bundle: AppBundle) => {
    const nextEnabled = !bundle.enabled
    const audience = bundle.channel === 'PRODUCTION' ? '전체 사용자' : '테스터'
    const label = `${PLATFORM_LABEL[bundle.platform] ?? bundle.platform} · ${uuidTail(bundle.uuid)}`
    const confirmed = await confirm(
      nextEnabled
        ? {
            title: '번들 켜기',
            description: `${label} 번들을 다시 켭니다. ${audience}의 기기가 다음 실행 때 이 번들을 받습니다.`,
            confirmLabel: '켜기',
          }
        : {
            title: '번들 끄기',
            description:
              `${label} 번들을 끕니다. 이 번들을 받은 기기는 다음 실행 때 직전 번들(없으면 앱에 내장된 번들)로 ` +
              `돌아가며, 이때 앱이 바로 다시 시작됩니다.`,
            confirmLabel: '끄기',
            destructive: true,
          },
    )
    if (!confirmed) return
    setBusyAction(bundle.uuid)
    const result = await run(
      setAppBundleEnabled(bundle.uuid, nextEnabled),
      nextEnabled ? '번들을 켜지 못했습니다' : '번들을 끄지 못했습니다',
    )
    setBusyAction(null)
    if (!result.ok) {
      if (result.message) toast(result.message, 'error')
      return
    }
    toast(nextEnabled ? `${label} 번들을 켰습니다.` : `${label} 번들을 껐습니다.`)
    reload()
  }

  return (
    <div className="admin-reports-page admin-app-bundles-page">
      <header className="admin-header">
        <div>
          <h1>앱 업데이트</h1>
          <p className="subtitle">
            스토어 심사 없이 내려가는 앱 화면 번들(OTA) · 최근 {BUNDLE_LIMIT}건
          </p>
        </div>
        <button
          type="button"
          className="bundle-promote"
          onClick={handlePromote}
          disabled={busyAction !== null || !data}
        >
          {busyAction === 'promote' ? '공개하는 중…' : `테스터 번들 전체 공개${testerOnlyCount > 0 ? ` (${testerOnlyCount})` : ''}`}
        </button>
      </header>

      <ul className="bundle-guide">
        <li>CI가 올린 번들은 <strong>테스터</strong>(앱 더보기에서 "베타 업데이트 받기"를 켠 기기)에게만 갑니다. 확인이 끝나면 전체 공개하세요.</li>
        <li>끄면 그 번들을 받은 기기가 다음 실행 때 직전 번들(없으면 앱에 내장된 번들)로 돌아갑니다.</li>
        <li>번들은 지문이 같은 앱에만 갑니다. 네이티브 코드가 바뀐 스토어 버전에는 가지 않습니다.</li>
      </ul>

      {loading && !data && <div className="state">불러오는 중…</div>}
      {error && <div className="state error">{error}</div>}

      {data && !error && (
        <div className="reports-table-wrap" aria-busy={loading}>
          <table className="reports-table">
            <thead>
              <tr>
                <th>번들</th>
                <th>플랫폼</th>
                <th>대상</th>
                <th>상태</th>
                <th>적용</th>
                <th>커밋</th>
                <th>메시지</th>
                <th>등록일</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((bundle) => (
                <tr key={bundle.uuid} className={bundle.enabled ? undefined : 'bundle-disabled'}>
                  <td className="bundle-uuid" title={bundle.uuid}>{uuidTail(bundle.uuid)}</td>
                  <td className="center">{PLATFORM_LABEL[bundle.platform] ?? bundle.platform}</td>
                  <td className="center">
                    <span className={`badge ${bundle.channel === 'PRODUCTION' ? 'badge-approved' : 'badge-pending'}`}>
                      {bundle.channel === 'PRODUCTION' ? '전체' : '테스터'}
                    </span>
                  </td>
                  <td className="center">
                    <span className={`badge ${bundle.enabled ? 'badge-enabled' : 'badge-rejected'}`}>
                      {bundle.enabled ? '켜짐' : '꺼짐'}
                    </span>
                  </td>
                  <td className="center">{bundle.forceUpdate ? '즉시' : '다음 실행'}</td>
                  <td className="bundle-commit" title={bundle.gitCommit ?? undefined}>
                    {bundle.gitCommit ? bundle.gitCommit.slice(0, COMMIT_SHORT_LENGTH) : '-'}
                  </td>
                  <td className="bundle-message" title={bundle.message ?? undefined}>
                    {bundle.message || '-'}
                  </td>
                  <td className="date">{bundle.createDate?.slice(0, 16).replace('T', ' ') ?? '-'}</td>
                  <td className="center">
                    <button
                      type="button"
                      className={`bundle-toggle${bundle.enabled ? ' danger' : ''}`}
                      disabled={busyAction !== null}
                      onClick={() => handleToggle(bundle)}
                    >
                      {busyAction === bundle.uuid ? '처리 중…' : bundle.enabled ? '끄기' : '켜기'}
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={9} className="center">등록된 번들이 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
