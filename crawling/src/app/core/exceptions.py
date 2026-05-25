class GeminiApiError(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(f"Gemini Api 에러가 발생하였습니다. code = {code}, message = {message}")