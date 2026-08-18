package com.chamapi.util;

import com.chamapi.admin.dto.request.AdminShelterBulkCreateItem;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.shelter.enums.ShelterType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * 대피소 대량 등록 엑셀을 {@link AdminShelterBulkCreateItem} 목록으로 변환한다.
 * 첫 번째 행은 헤더로 간주해 건너뛰고, 셀 접근은 모두 {@link PoiUtil}에 위임한다.
 * 컬럼 순서는 아래 상수({@code COL_*})로 고정한다.
 */
public class ExcelMapper {

    // 엑셀 컬럼 인덱스(0-based). 첫 행은 헤더.
    private static final int COL_DEPTH0_REGION_NAME = 0;
    private static final int COL_DEPTH1_REGION_NAME = 1;
    private static final int COL_DEPTH2_REGION_NAME = 2;
    private static final int COL_NAME = 3;
    private static final int COL_ENGLISH_NAME = 4;
    private static final int COL_DESCRIPTION = 5;
    private static final int COL_ADDRESS = 6;
    private static final int COL_OLD_ADDRESS = 7;
    private static final int COL_ENGLISH_ADDRESS = 8;
    private static final int COL_SHELTER_TYPE = 9;
    private static final int COL_AREA = 10;
    private static final int COL_CAPACITY = 11;
    private static final int COL_BUILT_YEAR = 12;
    private static final int COL_SAFETY_GRADE = 13;
    private static final int COL_MANAGING_AUTHORITY_NAME = 14;
    private static final int COL_MANAGING_AUTHORITY_TEL_NO = 15;

    public static List<AdminShelterBulkCreateItem> toBulkCreateItems(MultipartFile file) {
        try (InputStream in = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(in)) {

            Sheet sheet = workbook.getSheetAt(0);
            List<AdminShelterBulkCreateItem> items = new ArrayList<>();

            // 0번 행은 헤더 → 1번부터 데이터
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (PoiUtil.isRowEmpty(row)) continue;
                items.add(toItem(row));
            }

            if (items.isEmpty()) {
                throw new BadRequestException("등록할 데이터가 없습니다.");
            }
            return items;
        } catch (IOException e) {
            throw new BadRequestException("엑셀 파일을 읽을 수 없습니다.");
        }
    }

    private static AdminShelterBulkCreateItem toItem(Row row) {
        return new AdminShelterBulkCreateItem(
                PoiUtil.getString(row, COL_DEPTH0_REGION_NAME),
                PoiUtil.getString(row, COL_DEPTH1_REGION_NAME),
                PoiUtil.getString(row, COL_DEPTH2_REGION_NAME),
                PoiUtil.getString(row, COL_NAME),
                PoiUtil.getString(row, COL_ENGLISH_NAME),
                PoiUtil.getString(row, COL_DESCRIPTION),
                PoiUtil.getString(row, COL_ADDRESS),
                PoiUtil.getString(row, COL_OLD_ADDRESS),
                PoiUtil.getString(row, COL_ENGLISH_ADDRESS),
                parseShelterType(PoiUtil.getString(row, COL_SHELTER_TYPE), row),
                toInteger(PoiUtil.getNumeric(row, COL_AREA)),
                toInteger(PoiUtil.getNumeric(row, COL_CAPACITY)),
                toInteger(PoiUtil.getNumeric(row, COL_BUILT_YEAR)),
                toInteger(PoiUtil.getNumeric(row, COL_SAFETY_GRADE)),
                PoiUtil.getString(row, COL_MANAGING_AUTHORITY_NAME),
                PoiUtil.getString(row, COL_MANAGING_AUTHORITY_TEL_NO)
        );
    }

    private static Integer toInteger(Double value) {
        return value == null ? null : (int) Math.round(value);
    }

    private static ShelterType parseShelterType(String value, Row row) {
        if (value == null || value.isBlank()) return null;
        try {
            return ShelterType.valueOf(value.trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "대피소 타입이 올바르지 않습니다: '" + value + "' (" + (row.getRowNum() + 1) + "번째 줄)");
        }
    }
}
