package com.chamapi.appupdate.service.impl;

import com.chamapi.appupdate.dto.request.AppBundleCreateRequest;
import com.chamapi.appupdate.dto.response.AppBundleCheckResponse;
import com.chamapi.appupdate.dto.response.AppBundleResponse;
import com.chamapi.appupdate.entity.AppBundle;
import com.chamapi.appupdate.enums.AppBundleChannel;
import com.chamapi.appupdate.enums.AppBundlePlatform;
import com.chamapi.appupdate.repository.AppBundleRepository;
import com.chamapi.appupdate.service.AppBundleService;
import com.chamapi.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AppBundleServiceImpl implements AppBundleService {

    static final String NIL_UUID = "00000000-0000-0000-0000-000000000000";
    private static final String S3_KEY_PREFIX = "app-bundles/";
    // 앱은 확인 직후 바로 받는다. 느린 망에서 받다 끊겨도 다음 실행 때 새 URL로 다시 받으니 길 필요 없다.
    private static final Duration DOWNLOAD_URL_TTL = Duration.ofMinutes(30);
    private static final Pattern UUID_PATTERN =
            Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
    private static final Pattern SHA256_PATTERN = Pattern.compile("^[0-9a-f]{64}$");

    private final AppBundleRepository appBundleRepository;
    private final S3Presigner s3Presigner;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;

    @Override
    public AppBundleCheckResponse check(String platform, String channel, String fingerprint,
                                        String bundleId, String minBundleId) {
        if (fingerprint == null || fingerprint.isBlank() || bundleId == null || bundleId.isBlank()) {
            throw new BadRequestException("fingerprint와 bundleId는 필수입니다.");
        }
        String minimum = minBundleId == null || minBundleId.isBlank() ? NIL_UUID : minBundleId;
        AppBundleChannel requestChannel = channel == null || channel.isBlank()
                ? AppBundleChannel.PRODUCTION
                : AppBundleChannel.from(channel);

        // 앱 내장 번들보다 옛 번들은 후보에서 뺀다(스토어 업데이트 뒤 옛 OTA로 되돌아가지 않게).
        List<AppBundle> candidates = appBundleRepository
                .findCandidates(AppBundlePlatform.from(platform), fingerprint, requestChannel.visibleChannels())
                .stream()
                .filter(bundle -> bundle.getUuid().compareTo(minimum) >= 0)
                .toList();

        boolean runningBuiltIn = bundleId.equals(NIL_UUID) || bundleId.compareTo(minimum) <= 0;

        Optional<AppBundle> newest = candidates.stream()
                .filter(bundle -> bundle.getUuid().compareTo(bundleId) > 0)
                .max(Comparator.comparing(AppBundle::getUuid));
        if (newest.isPresent()) {
            return toResponse(newest.get(), "UPDATE");
        }

        // 지금 돌고 있는 번들이 아직 켜져 있으면 그대로 둔다.
        boolean currentStillEnabled = candidates.stream().anyMatch(bundle -> bundle.getUuid().equals(bundleId));
        if (runningBuiltIn || currentStillEnabled) {
            return null;
        }

        // 지금 번들이 꺼졌다 → 그보다 옛것 중 켜진 최신으로, 없으면 앱 내장 번들로 되돌린다.
        return candidates.stream()
                .filter(bundle -> bundle.getUuid().compareTo(bundleId) < 0)
                .max(Comparator.comparing(AppBundle::getUuid))
                .map(bundle -> toResponse(bundle, "ROLLBACK"))
                .orElseGet(() -> new AppBundleCheckResponse(NIL_UUID, "ROLLBACK", true, null, null, null));
    }

    @Override
    @Transactional
    public AppBundleResponse register(AppBundleCreateRequest request) {
        if (request.uuid() == null || !UUID_PATTERN.matcher(request.uuid()).matches()) {
            throw new BadRequestException("uuid는 소문자 UUID 형식이어야 합니다.");
        }
        if (request.fingerprint() == null || request.fingerprint().isBlank()) {
            throw new BadRequestException("fingerprint는 필수입니다.");
        }
        if (request.s3Key() == null || !request.s3Key().startsWith(S3_KEY_PREFIX)) {
            throw new BadRequestException("s3Key는 " + S3_KEY_PREFIX + " 아래여야 합니다.");
        }
        if (request.fileHash() == null || !SHA256_PATTERN.matcher(request.fileHash()).matches()) {
            throw new BadRequestException("fileHash는 SHA-256 소문자 hex 64자여야 합니다.");
        }
        if (appBundleRepository.findByUuid(request.uuid()).isPresent()) {
            throw new BadRequestException("이미 등록된 번들입니다: " + request.uuid());
        }

        AppBundle saved = appBundleRepository.save(AppBundle.builder()
                .uuid(request.uuid())
                .platform(AppBundlePlatform.from(request.platform()))
                .channel(request.channel() == null || request.channel().isBlank()
                        ? null
                        : AppBundleChannel.from(request.channel()))
                .fingerprint(request.fingerprint())
                .s3Key(request.s3Key())
                .fileHash(request.fileHash())
                .gitCommit(request.gitCommit())
                .message(request.message())
                .forceUpdate(request.forceUpdate())
                .build());
        return AppBundleResponse.from(saved);
    }

    @Override
    @Transactional
    public List<AppBundleResponse> promoteAll() {
        List<AppBundle> promotable = appBundleRepository.findPromotable();
        promotable.forEach(AppBundle::promote);
        return promotable.stream().map(AppBundleResponse::from).toList();
    }

    @Override
    @Transactional
    public AppBundleResponse changeEnabled(String uuid, boolean enabled) {
        AppBundle bundle = appBundleRepository.findByUuid(uuid)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 번들입니다: " + uuid));
        bundle.changeEnabled(enabled);
        return AppBundleResponse.from(bundle);
    }

    @Override
    public List<AppBundleResponse> findRecent(int limit) {
        return appBundleRepository.findRecent(Math.clamp(limit, 1, 100)).stream()
                .map(AppBundleResponse::from)
                .toList();
    }

    /** hot-updater 서버와 같이, 롤백은 항상 즉시 재시작해 적용한다. */
    private AppBundleCheckResponse toResponse(AppBundle bundle, String status) {
        boolean force = status.equals("ROLLBACK") || bundle.isForceUpdate();
        return new AppBundleCheckResponse(
                bundle.getUuid(),
                status,
                force,
                bundle.getMessage(),
                presignDownloadUrl(bundle.getS3Key()),
                bundle.getFileHash()
        );
    }

    private String presignDownloadUrl(String s3Key) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(DOWNLOAD_URL_TTL)
                .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(s3Key).build())
                .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }
}
