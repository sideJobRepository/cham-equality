package com.chamapi.push.service;

import com.chamapi.multilingual.entity.Language;
import com.chamapi.shelter.event.AppReportDecidedEvent.Result;

import java.util.Map;

/** 제보 결과 알림 문구(5개 언어). 대피소 이름은 원문(한국어) 그대로 넣는다. */
record ReportResultText(String title, String bodyTemplate) {

    private static final Map<Language, ReportResultText> APPROVED = Map.of(
            Language.KO, new ReportResultText("제보가 반영되었어요", "%s 접근성 제보가 승인되어 지도에 반영되었어요. 감사합니다!"),
            Language.EN, new ReportResultText("Your report was approved", "Your accessibility report for %s was approved and is now on the map. Thank you!"),
            Language.ZH, new ReportResultText("您的报告已被采纳", "您对 %s 的无障碍报告已通过审核并显示在地图上。谢谢！"),
            Language.JA, new ReportResultText("報告が反映されました", "%s のアクセシビリティ報告が承認され、地図に反映されました。ありがとうございます！"),
            Language.VI, new ReportResultText("Báo cáo của bạn đã được duyệt", "Báo cáo về khả năng tiếp cận của %s đã được duyệt và hiển thị trên bản đồ. Cảm ơn bạn!"));

    private static final Map<Language, ReportResultText> REJECTED = Map.of(
            Language.KO, new ReportResultText("제보가 반려되었어요", "%s 접근성 제보가 반려되었어요. 내용을 확인해 다시 제보해 주세요."),
            Language.EN, new ReportResultText("Your report was not approved", "Your accessibility report for %s was not approved. Please check and submit again."),
            Language.ZH, new ReportResultText("您的报告未被采纳", "您对 %s 的无障碍报告未通过审核。请确认后重新提交。"),
            Language.JA, new ReportResultText("報告は承認されませんでした", "%s のアクセシビリティ報告は承認されませんでした。内容を確認して再度ご報告ください。"),
            Language.VI, new ReportResultText("Báo cáo của bạn chưa được duyệt", "Báo cáo về khả năng tiếp cận của %s chưa được duyệt. Vui lòng kiểm tra và gửi lại."));

    private static final Map<Language, ReportResultText> REJECTED_OTHER_APPROVED = Map.of(
            Language.KO, new ReportResultText("제보가 반려되었어요", "%s에 다른 제보가 먼저 반영되어 이번 제보는 반려되었어요. 참여해 주셔서 감사합니다."),
            Language.EN, new ReportResultText("Your report was not approved", "Another report for %s was approved first, so yours was closed. Thank you for taking part."),
            Language.ZH, new ReportResultText("您的报告未被采纳", "%s 已采纳了其他报告，因此您的报告已关闭。感谢您的参与。"),
            Language.JA, new ReportResultText("報告は承認されませんでした", "%s には別の報告が先に反映されたため、今回の報告は終了しました。ご参加ありがとうございます。"),
            Language.VI, new ReportResultText("Báo cáo của bạn chưa được duyệt", "Một báo cáo khác về %s đã được duyệt trước nên báo cáo của bạn đã đóng. Cảm ơn bạn đã tham gia."));

    static ReportResultText of(Result result, Language language) {
        Map<Language, ReportResultText> texts = switch (result) {
            case APPROVED -> APPROVED;
            case REJECTED -> REJECTED;
            case REJECTED_OTHER_APPROVED -> REJECTED_OTHER_APPROVED;
        };
        return texts.getOrDefault(language, texts.get(Language.KO));
    }

    String body(String shelterName) {
        return bodyTemplate.formatted(shelterName == null || shelterName.isBlank() ? "-" : shelterName);
    }
}
