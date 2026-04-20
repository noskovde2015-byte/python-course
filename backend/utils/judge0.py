import httpx
import asyncio

BASE_URL = "https://ce.judge0.com"


async def run_code(code: str, stdin: str = "", language_id: int = 71) -> str:
    async with httpx.AsyncClient() as client:

        # 1. отправляем код
        response = await client.post(
            f"{BASE_URL}/submissions?base64_encoded=false&wait=false",
            json={
                "source_code": code,
                "language_id": language_id,
                "stdin": stdin,
            },
        )

        token = response.json()["token"]

        # 2. ждём выполнения
        while True:
            result = await client.get(
                f"{BASE_URL}/submissions/{token}?base64_encoded=false"
            )

            data = result.json()

            status_id = data["status"]["id"]

            if status_id in [1, 2]:  # In Queue / Processing
                await asyncio.sleep(0.5)
                continue

            return data.get("stdout") or data.get("stderr") or "No output"
