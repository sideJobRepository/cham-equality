package com.chamapi.shelter.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.member.entity.Member;
import com.chamapi.member.enums.SocialType;
import com.chamapi.member.repository.MemberRepository;
import com.chamapi.shelter.dto.request.ShelterInfoAppReportCreateRequest;
import com.chamapi.shelter.dto.request.ShelterInfoAppReportUpdateRequest;
import com.chamapi.shelter.dto.response.ShelterAppReportListResponse;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterInfoAppReport;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.repository.ShelterInfoAppReportRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import com.chamapi.shelter.repository.ShelterImageRepository;
import com.chamapi.shelter.enums.ShelterImageCategory;
import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileStatus;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.repository.CommonFileRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class ShelterInfoAppReportServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private ShelterInfoAppReportService appReportService;

    @Autowired
    private ShelterInfoAppReportRepository appReportRepository;

    @Autowired
    private ShelterRepository shelterRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private CommonFileRepository commonFileRepository;

    @Autowired
    private ShelterImageRepository shelterImageRepository;

    @Autowired
    private EntityManager em;

    @DisplayName("미조사 대피소면 제보가 대기상태로 저장되고 회원ID와 접근성이 기록된다")
    @Test
    void test1() {
        Member member = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.NOT_INVESTIGATED);

        Long reportId = appReportService.createReport(
                createRequest(shelter.getId(), "한국어", true, false, true, false, "음성안내"),
                member.getId());

        ShelterInfoAppReport saved = appReportRepository.findById(reportId).orElseThrow();
        assertThat(saved.getRequestStatus()).isEqualTo(ShelterInfoReportStatus.PENDING);
        assertThat(saved.getMemberId()).isEqualTo(member.getId());
        assertThat(saved.getAccessibility().getAccessibleToilet()).isTrue();
        assertThat(saved.getAccessibility().getElevator()).isTrue();
        assertThat(saved.getSignageLanguage()).isEqualTo("한국어");
    }

    @DisplayName("조사완료 대피소면 접수가 막힌다(BadRequestException)")
    @Test
    void test2() {
        Member member = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.INVESTIGATED);

        assertThatThrownBy(() -> appReportService.createReport(
                createRequest(shelter.getId(), null, true, null, null, null, null),
                member.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("이미 조사가 완료된");
    }

    @DisplayName("재조사 대피소도 비밀번호 없이 로그인만으로 접수된다")
    @Test
    void test3() {
        Member member = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.RE_INVESTIGATION);

        Long reportId = appReportService.createReport(
                createRequest(shelter.getId(), null, true, null, null, null, null),
                member.getId());

        assertThat(appReportRepository.findById(reportId)).isPresent();
    }

    @DisplayName("내 제보 목록은 본인 것만 최신순으로 나오고 시설명이 채워진다")
    @Test
    void test4() {
        Member me = persistMember();
        Member other = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.NOT_INVESTIGATED);
        Long mine1 = appReportService.createReport(
                createRequest(shelter.getId(), null, true, null, null, null, null), me.getId());
        Long mine2 = appReportService.createReport(
                createRequest(shelter.getId(), null, false, null, null, null, null), me.getId());
        appReportService.createReport(
                createRequest(shelter.getId(), null, true, null, null, null, null), other.getId());

        List<ShelterAppReportListResponse> myReports = appReportService.findMyReports(me.getId());

        assertThat(myReports).extracting(ShelterAppReportListResponse::id)
                .containsExactlyInAnyOrder(mine1, mine2);
        assertThat(myReports).allSatisfy(r -> assertThat(r.shelterName()).isEqualTo("테스트대피소"));
    }

    @DisplayName("본인 대기상태 제보면 접근성과 안내문언어가 수정된다")
    @Test
    void test5() {
        Member member = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.NOT_INVESTIGATED);
        Long reportId = appReportService.createReport(
                createRequest(shelter.getId(), "KO", false, false, false, false, null), member.getId());

        appReportService.updateReport(reportId, member.getId(),
                updateRequest("한국어", true, true, null, null, "점자안내"));

        ShelterInfoAppReport updated = appReportRepository.findById(reportId).orElseThrow();
        assertThat(updated.getSignageLanguage()).isEqualTo("한국어");
        assertThat(updated.getAccessibility().getAccessibleToilet()).isTrue();
        assertThat(updated.getAccessibility().getRamp()).isTrue();
        assertThat(updated.getAccessibility().getEtcFacilities()).isEqualTo("점자안내");
    }

    @DisplayName("본인 제보가 아니면 수정 시 BadRequestException")
    @Test
    void test6() {
        Member owner = persistMember();
        Member stranger = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.NOT_INVESTIGATED);
        Long reportId = appReportService.createReport(
                createRequest(shelter.getId(), null, true, null, null, null, null), owner.getId());

        assertThatThrownBy(() -> appReportService.updateReport(reportId, stranger.getId(),
                updateRequest("KO", true, null, null, null, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("본인 제보가 아니거나");
    }

    @DisplayName("대기상태가 아니면 수정 시 BadRequestException")
    @Test
    void test7() {
        Member member = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.NOT_INVESTIGATED);
        ShelterInfoAppReport approved = appReportRepository.save(ShelterInfoAppReport.builder()
                .shelterId(shelter.getId())
                .memberId(member.getId())
                .requestStatus(ShelterInfoReportStatus.APPROVED)
                .build());

        assertThatThrownBy(() -> appReportService.updateReport(approved.getId(), member.getId(),
                updateRequest("KO", true, null, null, null, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("대기 중인 제보만");
    }

    @DisplayName("이미지 fileId를 함께 보내면 파일이 제보에 연결되고 완료 상태가 된다")
    @Test
    void test8() {
        Member member = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.NOT_INVESTIGATED);
        // presigned 업로드(클라이언트 S3 PUT)는 외부 동작이라, 등록된 CommonFile만 흉내내어 심는다.
        CommonFile file = commonFileRepository.save(CommonFile.builder()
                .fileName("toilet.jpg")
                .filePath("app-shelter/toilet.jpg")
                .fileType(FileType.APP_SHELTER_IMAGE)
                .fileStatus(FileStatus.TEMPORARY)
                .build());

        Long reportId = appReportService.createReport(
                new ShelterInfoAppReportCreateRequest(
                        shelter.getId(), "한국어", true, null, null, null, null,
                        List.of(new ShelterInfoAppReportCreateRequest.ImageItem(
                                file.getId(), ShelterImageCategory.TOILET, "장애인 화장실"))),
                member.getId());

        CommonFile linked = commonFileRepository.findById(file.getId()).orElseThrow();
        assertThat(linked.getTargetId()).isEqualTo(reportId);
        assertThat(linked.getFileStatus()).isEqualTo(FileStatus.COMPLETE);
        assertThat(shelterImageRepository.findAllByFileIdIn(List.of(file.getId())))
                .singleElement()
                .satisfies(img -> {
                    assertThat(img.getCategory()).isEqualTo(ShelterImageCategory.TOILET);
                    assertThat(img.getShelterId()).isEqualTo(shelter.getId());
                });
    }

    private Member persistMember() {
        return memberRepository.save(Member.builder()
                .memberName("테스트유저")
                .email("t" + System.nanoTime() + "@test.com")
                .socialType(SocialType.KAKAO)
                .socialId("test-" + System.nanoTime())
                .build());
    }

    private Shelter persistShelter(ShelterSurveyStatus status) {
        Region region = new Region(null, "대전광역시", "광역시", 1, null, null);
        em.persist(region);
        Place place = Place.builder()
                .region(region)
                .name("테스트장소")
                .address("대전광역시 중구")
                .build();
        em.persist(place);
        return shelterRepository.save(Shelter.builder()
                .place(place)
                .name("테스트대피소")
                .surveyStatus(status)
                .build());
    }

    private ShelterInfoAppReportCreateRequest createRequest(
            Long shelterId, String signageLanguage,
            Boolean accessibleToilet, Boolean ramp, Boolean elevator, Boolean brailleBlock, String etcFacilities
    ) {
        return new ShelterInfoAppReportCreateRequest(
                shelterId, signageLanguage,
                accessibleToilet, ramp, elevator, brailleBlock, etcFacilities,
                null);
    }

    private ShelterInfoAppReportUpdateRequest updateRequest(String signageLanguage, Boolean accessibleToilet, Boolean ramp, Boolean elevator, Boolean brailleBlock, String etcFacilities) {
        return new ShelterInfoAppReportUpdateRequest(signageLanguage, accessibleToilet, ramp, elevator, brailleBlock, etcFacilities, null);
    }
}
