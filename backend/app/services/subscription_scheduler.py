"""
Automated subscription reminder scheduler.

Uses pure asyncio — no external libraries (no APScheduler, Celery, etc).
Runs every 24 hours. Iterates all notify-enabled active subscriptions and
sends Gmail reminders when billing is within the configured window.
Deduped per calendar month via last_notified_month on each Subscription doc.
"""
import asyncio
import logging
from datetime import date

from app.models.subscription import Subscription
from app.utils.email_service import send_subscription_reminder

logger = logging.getLogger(__name__)

_scheduler_task: asyncio.Task | None = None


async def _check_and_send_reminders() -> None:
    """
    Core scheduler job.
    Queries all active, notify-enabled Subscriptions across all users,
    checks if today falls within the notify window, and sends an email.
    The user_email is stored on each Subscription at creation time (from JWT).
    """
    today = date.today()
    current_month = today.strftime("%Y-%m")

    try:
        items = await Subscription.find(
            Subscription.notify == True,
            Subscription.is_active == True,
        ).to_list()
    except Exception as e:
        logger.error(f"Scheduler: DB fetch failed — {e}")
        return

    sent_count = 0

    for sub in items:
        try:
            today_str = today.isoformat()
            # ── Already notified today? Skip ──────────────────────────
            if getattr(sub, "last_notified_date", None) == today_str:
                continue

            # ── Email available? ───────────────────────────────────────────
            email = (sub.user_email or "").strip()
            if not email:
                logger.warning(f"Scheduler: no email on subscription '{sub.name}' (user {sub.user_id})")
                continue

            # ── Calculate next billing date ────────────────────────────────
            day = min(sub.billing_day, 28)          # safe for Feb
            billing_date = date(today.year, today.month, day)
            if billing_date <= today:               # already passed → next month 
                if today.month == 12:
                    billing_date = date(today.year + 1, 1, day)
                else:
                    billing_date = date(today.year, today.month + 1, day)

            days_until = (billing_date - today).days

            # ── Within notification window? (up to final billing day) ──────
            if days_until < 0 or days_until > sub.notify_days_before:
                continue

            # ── Send email ─────────────────────────────────────────────────
            success = send_subscription_reminder(
                to_email=email,
                subscription_name=sub.name,
                amount=sub.amount,
                billing_day=sub.billing_day,
                days_before=days_until,
            )

            if success:
                sub.last_notified_date = today_str
                await sub.save()
                sent_count += 1
                logger.info(
                    f"📧 Reminder sent: '{sub.name}' → {email} "
                    f"(bills day {sub.billing_day}, {days_until}d away)"
                )

        except Exception as e:
            logger.warning(f"Scheduler: error processing '{getattr(sub, 'name', '?')}': {e}")

    logger.info(
        f"✅ Scheduler run complete — {sent_count} reminder(s) sent "
        f"out of {len(items)} notify-enabled subscription(s)."
    )


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
