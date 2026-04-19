"""
Automated reminder scheduler — Subscriptions + EMI loans.

Uses pure asyncio — no external libraries.
Runs every 24 hours. Deduped per calendar day via last_notified_date.
"""
import asyncio
import logging
from datetime import date

from app.models.subscription import Subscription
from app.models.emi import EMIEntry
from app.utils.email_service import send_subscription_reminder, send_emi_reminder

logger = logging.getLogger(__name__)

_scheduler_task: asyncio.Task | None = None


async def _check_and_send_reminders() -> None:
    today     = date.today()
    today_str = today.isoformat()

    # ── 1. Subscriptions ────────────────────────────────────────────────────────
    sub_sent = 0
    try:
        subs = await Subscription.find(
            Subscription.notify == True,
            Subscription.is_active == True,
        ).to_list()
    except Exception as e:
        logger.error(f"Scheduler: subscription DB fetch failed — {e}")
        subs = []

    for sub in subs:
        try:
            if getattr(sub, "last_notified_date", None) == today_str:
                continue
            email = (sub.user_email or "").strip()
            if not email:
                continue
            day          = min(sub.billing_day, 28)
            billing_date = date(today.year, today.month, day)
            if billing_date <= today:
                billing_date = date(today.year + 1, 1, day) if today.month == 12 else date(today.year, today.month + 1, day)
            days_until = (billing_date - today).days
            if days_until < 0 or days_until > sub.notify_days_before:
                continue
            success = send_subscription_reminder(
                to_email=email, subscription_name=sub.name,
                amount=sub.amount, billing_day=sub.billing_day, days_before=days_until,
            )
            if success:
                sub.last_notified_date = today_str
                await sub.save()
                sub_sent += 1
                logger.info(f"📧 Sub reminder: '{sub.name}' → {email} ({days_until}d away)")
        except Exception as e:
            logger.warning(f"Scheduler: sub error '{getattr(sub, 'name', '?')}': {e}")

    # ── 2. EMI loans ────────────────────────────────────────────────────────────
    emi_sent = 0
    try:
        emis = await EMIEntry.find(
            EMIEntry.notify == True,
            EMIEntry.is_active == True,
        ).to_list()
    except Exception as e:
        logger.error(f"Scheduler: EMI DB fetch failed — {e}")
        emis = []

    for emi in emis:
        try:
            if getattr(emi, "last_notified_date", None) == today_str:
                continue
            email = (getattr(emi, "user_email", None) or "").strip()
            if not email:
                continue
            pay_day      = min(getattr(emi, "payment_day", 1) or 1, 28)
            payment_date = date(today.year, today.month, pay_day)
            if payment_date <= today:
                payment_date = date(today.year + 1, 1, pay_day) if today.month == 12 else date(today.year, today.month + 1, pay_day)
            days_until = (payment_date - today).days
            if days_until < 0 or days_until > emi.notify_days_before:
                continue
            from app.api.v1.endpoints.emi import _calculate_emi
            custom = getattr(emi, "custom_monthly_amount", None)
            monthly_emi = custom if (custom and custom > 0) \
                          else _calculate_emi(emi.principal, emi.annual_interest_rate, emi.tenure_months)
            success = send_emi_reminder(
                to_email=email, emi_name=emi.name, monthly_emi=monthly_emi,
                payment_day=pay_day, days_before=days_until,
                category=emi.category, bank_name=emi.bank_name or "",
            )
            if success:
                emi.last_notified_date = today_str
                await emi.save()
                emi_sent += 1
                logger.info(f"🏦 EMI reminder: '{emi.name}' → {email} ({days_until}d away)")
        except Exception as e:
            logger.warning(f"Scheduler: EMI error '{getattr(emi, 'name', '?')}': {e}")

    logger.info(f"✅ Scheduler done — {sub_sent} sub + {emi_sent} EMI reminder(s) sent.")


async def _daily_loop() -> None:
    """
    Infinite asyncio loop.
    Runs once immediately on FastAPI startup, then waits 24 h and repeats.
    """
    logger.info("🕐 Subscription reminder scheduler started (runs every 24 h).")
    while True:
        try:
            await _check_and_send_reminders()
        except asyncio.CancelledError:
            raise                               # let it propagate on shutdown
        except Exception as e:
            logger.error(f"Scheduler: unexpected loop error — {e}", exc_info=True)

        try:
            await asyncio.sleep(24 * 60 * 60)  # 24 hours
        except asyncio.CancelledError:
            break                               # clean shutdown


def start_scheduler() -> None:
    """Call from FastAPI lifespan/startup to launch the background task."""
    global _scheduler_task
    _scheduler_task = asyncio.create_task(_daily_loop())
    logger.info("🚀 Subscription scheduler task created.")


def stop_scheduler() -> None:
    """Cancel the task cleanly on FastAPI shutdown."""
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
        logger.info("🛑 Subscription scheduler stopped.")
