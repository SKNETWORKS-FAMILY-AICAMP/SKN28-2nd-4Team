from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator

import httpx

from be.schemas import ChatMessage
from be.settings import Settings


class ChatService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def stream_reply(self, messages: list[ChatMessage]) -> AsyncIterator[str]:
        prompt = self._latest_user_text(messages)

        if not prompt:
            async for chunk in self._chunk_text(
                "No operator request was provided. Ask for a retention, trust, or incident response plan."
            ):
                yield chunk
            return

        if not self.settings.llm_api_key:
            async for chunk in self._chunk_text(self._mock_response(prompt)):
                yield chunk
            return

        try:
            response_text = await self._generate_openai_compatible_response(messages)
        except httpx.HTTPError:
            if not self.settings.llm_allow_mock_fallback:
                raise
            response_text = self._mock_response(prompt)

        async for chunk in self._chunk_text(response_text):
            yield chunk

    async def _generate_openai_compatible_response(self, messages: list[ChatMessage]) -> str:
        payload = {
            "model": self.settings.llm_model,
            "temperature": 0.35,
            "messages": [
                {
                    "role": "system",
                    "content": self.settings.llm_system_prompt,
                },
                *[
                    {
                        "role": message.role,
                        "content": self._message_text(message),
                    }
                    for message in messages
                    if self._message_text(message)
                ],
            ],
        }

        async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
            response = await client.post(
                f"{self.settings.llm_base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.settings.llm_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()

        body = response.json()
        return body["choices"][0]["message"]["content"]

    def _latest_user_text(self, messages: list[ChatMessage]) -> str:
        for message in reversed(messages):
            if message.role == "user":
                text = self._message_text(message)
                if text:
                    return text
        return ""

    def _message_text(self, message: ChatMessage) -> str:
        return "\n".join(part.text.strip() for part in message.parts if part.text.strip()).strip()

    def _mock_response(self, prompt: str) -> str:
        return (
            "Mock operator response. "
            f"For the request '{prompt}', start with immediate containment for the highest-risk cohort, "
            "keep pricing and messaging changes narrow, and validate the intervention against the prediction engine "
            "before arming a broader retention policy."
        )

    async def _chunk_text(self, text: str) -> AsyncIterator[str]:
        words = text.split()
        for index, word in enumerate(words):
            suffix = " " if index < len(words) - 1 else ""
            yield f"{word}{suffix}"
            await asyncio.sleep(0.005)
