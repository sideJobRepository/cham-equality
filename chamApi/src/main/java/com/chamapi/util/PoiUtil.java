package com.chamapi.util;

import com.chamapi.common.exception.BadRequestException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellReference;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class PoiUtil {

    public static String getString(Row row, int col) {
        Cell c = row.getCell(col);
        if (c == null) return null;
        return switch (c.getCellType()) {
            case STRING -> c.getStringCellValue();
            case NUMERIC -> new DataFormatter().formatCellValue(c); // "1234"나 "1,234"도 문자열로
            case BOOLEAN -> String.valueOf(c.getBooleanCellValue());
            case FORMULA -> new DataFormatter().formatCellValue(c);
            default -> null;
        };
    }
    
    
    public static Double getNumeric(Row row, int col) {
        Cell c = row.getCell(col);
        if (c == null) return null;
        return switch (c.getCellType()) {
            case NUMERIC -> c.getNumericCellValue();
            case STRING -> {
                String s = c.getStringCellValue();
                if (s == null) yield null;
                String cleaned = s.replaceAll("[,\\s]", "");
                try { yield Double.valueOf(cleaned); } catch (NumberFormatException e) { yield null; }
            }
            case FORMULA -> {
                if (c.getCachedFormulaResultType() == CellType.NUMERIC) {
                   yield c.getNumericCellValue();
                }
                String fmt = new DataFormatter().formatCellValue(c);
                try { yield Double.valueOf(fmt.replaceAll("[,\\s]", "")); } catch (Exception e) { yield null; }
            }
            default -> null;
        };
    }
    
    public static String getCellValue(Row row, int cellNum) {
        if (row == null) return "";
        Cell cell = row.getCell(cellNum);
        if (cell == null) return "";
        
        String value = switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                } else {
                    yield String.valueOf(cell.getNumericCellValue());
                }
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> switch (cell.getCachedFormulaResultType()) {
                case STRING -> cell.getStringCellValue();
                case NUMERIC -> String.valueOf(cell.getNumericCellValue());
                case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
                default -> "";
            };
            default -> "";
        };
        
        return sanitize(value);
    }
    
    private static String sanitize(String input) {
        if (input == null) return "";
        return input
                .replace("\u00A0", " ")     // non-breaking space → 일반 공백
                .replaceAll("\\s+", " ")    // 연속 공백 → 공백 하나
                .trim();                    // 앞뒤 공백 제거
    }
    public static LocalTime getLocalTimeFromCell(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING -> {
                String value = cell.getStringCellValue().trim();
                
                // Excel에 "9:07"처럼 들어올 때 안전하게 처리
                try {
                    // 1) 기본 HH:mm:ss 시도
                    return LocalTime.parse(value, DateTimeFormatter.ofPattern("H:mm[:ss]"));
                } catch (DateTimeParseException e) {
                    // 2) 혹시 "9.07"이나 "9시07분" 같은 이상한 형식이 들어왔을 때도 방어
                    String normalized = value
                            .replace("시", ":")
                            .replace("분", "")
                            .replace(".", ":")
                            .trim();
                    
                    try {
                        return LocalTime.parse(normalized, DateTimeFormatter.ofPattern("H:mm[:ss]"));
                    } catch (Exception ignored) {
                        return LocalTime.of(0,0,0);
                    }
                }
            }
            
            case NUMERIC -> {
                double value = cell.getNumericCellValue();
                return LocalTime.ofSecondOfDay((int) (value * 86400)); // 하루 86400초
            }
            
            default -> {
                return LocalTime.of(0, 0, 0);
            }
        }
    }
    
    
    public static LocalDate getLocalDateFromCell(Cell cell) {
        if (cell == null) {
            return null;
        }
        
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return DateUtil.getLocalDateTime(cell.getNumericCellValue()).toLocalDate();
        } else if (cell.getCellType() == CellType.STRING) {
            String value = cell.getStringCellValue().trim();
            
            try {
                return LocalDate.parse(value, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            } catch (DateTimeParseException e) {
                String where = formatCellPosition(cell); // ex) "E열 22번째 줄"
                throw new BadRequestException("날짜 형식이 올바르지 않습니다: " + where + " 값='" + value + "'");
            }
        } else {
            String where = formatCellPosition(cell); // ex) "E열 22번째 줄"
            throw new BadRequestException("날짜 형식이 올바르지 않습니다: " + where);
        }
    }
    
    
    public static boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                if (cell.getCellType() == CellType.STRING && !cell.getStringCellValue().trim().isEmpty()) {
                    return false;
                }
                if (cell.getCellType() != CellType.STRING) {
                    return false;
                }
            }
        }
        return true;
    }
    
    public static String parsePersonnel(Cell c) {
        if (c == null) return "";
        return switch (c.getCellType()) {
            case STRING -> sanitize(c.getStringCellValue());
            case NUMERIC -> String.valueOf((int) c.getNumericCellValue());
            case FORMULA -> switch (c.getCachedFormulaResultType()) {
                case STRING  -> sanitize(c.getStringCellValue());
                case NUMERIC -> String.valueOf((int) c.getNumericCellValue());
                default -> "";
            };
            default -> "";
        };
    }
    
    private static String formatCellPosition(Cell cell) {
        if (cell == null) return "(unknown)";
        String col = CellReference.convertNumToColString(cell.getColumnIndex()); // 0 → A, 4 → E
        int row = cell.getRowIndex() + 1; // 엑셀은 1부터 시작
        return col + "열 " + row + "번째 줄";
    }
    
    
}
