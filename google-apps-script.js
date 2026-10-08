/**
 * ==============================================================================
 * 구글 시트 CRUD Google Apps Script (Code.gs)
 * 
 * 구글 스프레드시트 ID: 102sbHElwtPr_oCy0MWf_UNqpSjY1ijSsy27PvDdy2wE
 * 컬럼 구성:
 *   - A열: timestamp (고유 식별자 / 생성 타임스탬프)
 *   - B열: datetime  (작성 날짜/시간 문자열)
 *   - C열: content   (일기 내용)
 * ==============================================================================
 */

// 연결할 스프레드시트 ID (바인딩된 시트일 경우 SpreadsheetApp.getActiveSpreadsheet() 사용 가능)
const SPREADSHEET_ID = '102sbHElwtPr_oCy0MWf_UNqpSjY1ijSsy27PvDdy2wE';
const SHEET_NAME = '시트1'; // 시트 탭 이름 (필요시 변경 가능)

/**
 * 활성 시트 객체 반환 헬퍼 함수
 */
function getTargetSheet() {
  let ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0]; // 첫 번째 시트 사용
  }
  
  // 헤더가 없을 경우 자동 초기화
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'datetime', 'content']);
  }
  return sheet;
}

/**
 * 1. CREATE: 새 일기 항목 추가
 * @param {Object} data { timestamp, datetime, content }
 */
function createEntry(data) {
  const sheet = getTargetSheet();
  const timestamp = data.timestamp || new Date().getTime().toString();
  const datetime = data.datetime || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  const content = data.content || '';

  sheet.appendRow([timestamp, datetime, content]);

  return {
    success: true,
    message: '성공적으로 저장되었습니다.',
    data: {
      timestamp: timestamp,
      datetime: datetime,
      content: content
    }
  };
}

/**
 * 2. READ: 전체 목록 또는 특정 timestamp 항목 조회
 * @param {string} [timestamp] 특정 항목 조회 시 전달
 */
function readEntries(timestamp) {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  // A2부터 C열 마지막까지 조회 (A: timestamp, B: datetime, C: content)
  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const results = values.map((row, index) => ({
    rowIndex: index + 2,
    timestamp: row[0].toString(),
    datetime: row[1] instanceof Date 
      ? Utilities.formatDate(row[1], 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss') 
      : row[1].toString(),
    content: row[2].toString()
  }));

  // 특정 timestamp 필터링
  if (timestamp) {
    const item = results.find(r => r.timestamp === timestamp.toString());
    if (item) {
      return { success: true, data: item };
    } else {
      return { success: false, message: '해당 timestamp의 항목을 찾을 수 없습니다.' };
    }
  }

  return { success: true, data: results };
}

/**
 * 3. UPDATE: timestamp 기준으로 항목 수정
 * @param {Object} data { timestamp, datetime, content }
 */
function updateEntry(data) {
  if (!data.timestamp) {
    return { success: false, message: '수정할 timestamp가 지정되지 않았습니다.' };
  }

  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { success: false, message: '데이터가 존재하지 않습니다.' };
  }

  const timestamps = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i][0].toString() === data.timestamp.toString()) {
      const targetRow = i + 2;

      if (data.datetime !== undefined) {
        sheet.getRange(targetRow, 2).setValue(data.datetime);
      }
      if (data.content !== undefined) {
        sheet.getRange(targetRow, 3).setValue(data.content);
      }

      return {
        success: true,
        message: '성공적으로 수정되었습니다.',
        data: {
          timestamp: data.timestamp,
          datetime: data.datetime,
          content: data.content
        }
      };
    }
  }

  return { success: false, message: '일치하는 timestamp를 찾을 수 없습니다.' };
}

/**
 * 4. DELETE: timestamp 기준으로 항목 삭제
 * @param {string} timestamp 삭제할 항목의 고유 timestamp
 */
function deleteEntry(timestamp) {
  if (!timestamp) {
    return { success: false, message: '삭제할 timestamp가 필요합니다.' };
  }

  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { success: false, message: '삭제할 데이터가 없습니다.' };
  }

  const timestamps = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i][0].toString() === timestamp.toString()) {
      sheet.deleteRow(i + 2);
      return {
        success: true,
        message: '성공적으로 삭제되었습니다.',
        deletedTimestamp: timestamp
      };
    }
  }

  return { success: false, message: '일치하는 timestamp를 찾을 수 없습니다.' };
}

/**
 * ==============================================================================
 * 웹 앱(Web App) API 라우트 핸들러 (doGet, doPost)
 * Next.js 및 외부 fetch 요청을 처리하기 위한 엔드포인트
 * ==============================================================================
 */

// GET 요청 처리 (주로 READ 작업)
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : 'read';
    const timestamp = e && e.parameter ? e.parameter.timestamp : null;

    let responseData;

    switch (action) {
      case 'read':
        responseData = readEntries(timestamp);
        break;
      case 'delete': // GET 쿼리스트링으로 삭제 지원 시
        responseData = deleteEntry(timestamp);
        break;
      default:
        responseData = readEntries();
        break;
    }

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// POST 요청 처리 (CREATE, UPDATE, DELETE 작업)
function doPost(e) {
  try {
    let requestData = {};
    if (e && e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      requestData = e.parameter;
    }

    const action = requestData.action || 'create';
    let responseData;

    switch (action) {
      case 'create':
        responseData = createEntry(requestData);
        break;
      case 'read':
        responseData = readEntries(requestData.timestamp);
        break;
      case 'update':
        responseData = updateEntry(requestData);
        break;
      case 'delete':
        responseData = deleteEntry(requestData.timestamp);
        break;
      default:
        responseData = { success: false, message: '지원하지 않는 action입니다. (create, read, update, delete)' };
        break;
    }

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
