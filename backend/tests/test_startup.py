from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import Mock

from fastapi import FastAPI


def test_startup_does_not_seed_sample_records_by_default(monkeypatch) -> None:
    import app.main as main
    import app.services.seed as seed
    from app.services.store import store

    settings = SimpleNamespace(
        app_name="EverWed",
        app_version="test",
        debug=True,
        odoo_url="http://localhost:8069",
        odoo_db="",
        odoo_configured=False,
        seed_demo_data_on_startup=False,
    )
    seed_operation = Mock()
    monkeypatch.setattr(main, "get_settings", lambda: settings)
    monkeypatch.setattr(store, "ping", lambda: True)
    monkeypatch.setattr(store, "close", lambda: None)
    monkeypatch.setattr(seed, "seed_demo_data", seed_operation)

    async def run_lifespan() -> None:
        async with main.lifespan(FastAPI()):
            pass

    asyncio.run(run_lifespan())
    seed_operation.assert_not_called()
