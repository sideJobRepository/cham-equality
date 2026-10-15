package com.chamapi.appupdate.repository.impl;

import com.chamapi.appupdate.entity.AppBundle;
import com.chamapi.appupdate.enums.AppBundleChannel;
import com.chamapi.appupdate.enums.AppBundlePlatform;
import com.chamapi.appupdate.repository.query.AppBundleQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static com.chamapi.appupdate.entity.QAppBundle.appBundle;

@RequiredArgsConstructor
public class AppBundleRepositoryImpl implements AppBundleQueryRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public Optional<AppBundle> findByUuid(String uuid) {
        return Optional.ofNullable(queryFactory
                .selectFrom(appBundle)
                .where(appBundle.uuid.eq(uuid))
                .fetchFirst());
    }

    @Override
    public List<AppBundle> findCandidates(AppBundlePlatform platform, String fingerprint,
                                          Collection<AppBundleChannel> channels) {
        return queryFactory
                .selectFrom(appBundle)
                .where(
                        appBundle.platform.eq(platform),
                        appBundle.fingerprint.eq(fingerprint),
                        appBundle.channel.in(channels),
                        appBundle.enabled.isTrue()
                )
                .fetch();
    }

    @Override
    public List<AppBundle> findPromotable() {
        return queryFactory
                .selectFrom(appBundle)
                .where(appBundle.channel.eq(AppBundleChannel.ALPHA), appBundle.enabled.isTrue())
                .fetch();
    }

    @Override
    public List<AppBundle> findRecent(int limit) {
        return queryFactory
                .selectFrom(appBundle)
                .orderBy(appBundle.id.desc())
                .limit(limit)
                .fetch();
    }
}
