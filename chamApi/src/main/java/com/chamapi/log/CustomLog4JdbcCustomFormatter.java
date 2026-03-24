package com.chamapi.log;

import net.sf.log4jdbc.log.SpyLogDelegator;
import net.sf.log4jdbc.sql.Spy;
import net.sf.log4jdbc.sql.resultsetcollector.ResultSetCollector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.regex.Pattern;

public class CustomLog4JdbcCustomFormatter implements SpyLogDelegator {
    
    
    private static final Logger sqlLogger = LoggerFactory.getLogger("jdbc.sqlonly");
    private static final Logger logger = LoggerFactory.getLogger("user.log");
    private static final Pattern CLEAN_PATTERN = Pattern.compile("\\n[\\t\\s]*\\n");
    private static final Pattern SQL_KEYWORDS = Pattern.compile(
            "\\b(from|where|and|or|group by|order by|having|left join|right join|inner join|outer join|select|insert into|values|update|set)\\b",
            Pattern.CASE_INSENSITIVE
    );
    
    
    @Override
    public boolean isJdbcLoggingEnabled() {
        return true;
    }
    
    @Override
    public void sqlOccurred(Spy spy, String methodCall, String rawSql) {
        // 1. 줄바꿈 정리
         String cleanedSql = CLEAN_PATTERN.matcher(rawSql).replaceAll("\n");
        
        // 2. SQL 키워드 기준으로 줄바꿈
        cleanedSql = SQL_KEYWORDS.matcher(cleanedSql).replaceAll("\n$1");
        
        // 3. 콤마 뒤에도 개행 추가 (SELECT, SET 등)
        cleanedSql = cleanedSql.replaceAll(",\\s*", ",\n  ");
        
        // 4. Mapper 정보 (ThreadLocal로부터)
        String mapperId = JpaQueryContextHolder.get();
        if (mapperId != null) {
            cleanedSql = "/* " + mapperId + " */" + cleanedSql;
            JpaQueryContextHolder.clear();
        }
        sqlLogger.info("[SQL] {} :::\n{}", methodCall, cleanedSql);
        
    }
    
    @Override
    public void sqlTimingOccurred(Spy spy, long execTime, String methodCall, String rawSql) {
    
    }
    
    @Override
    public void exceptionOccured(Spy spy, String methodCall, Exception e, String sql, long execTime) {
        sqlLogger.error("SQL ERROR [{}] :::\n{}", execTime, sql, e);
    }
    
    @Override
    public void methodReturned(Spy spy, String returnMsg, String methodCall) {
    
    }
    
    @Override
    public void constructorReturned(Spy spy, String constructorMsg) {
    
    }
    
    @Override
    public void connectionOpened(Spy spy, long execTime) {
    
    }
    
    @Override
    public void connectionClosed(Spy spy, long execTime) {
    
    }
    
    @Override
    public void connectionAborted(Spy spy, long execTime) {
    
    }
    
    @Override
    public void debug(String msg) {
    
    }
    
    @Override
    public boolean isResultSetCollectionEnabled() {
        return false;
    }
    
    @Override
    public boolean isResultSetCollectionEnabledWithUnreadValueFillIn() {
        return false;
    }
    
    @Override
    public void resultSetCollected(ResultSetCollector resultSetCollector) {
    
    }
}
