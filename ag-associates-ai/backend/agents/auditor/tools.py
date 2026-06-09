"""Auditor agent tools — financial analysis functions.

Wraps existing finance_auditor.py and adds complementary analysis functions.
Each tool is a plain async function that can be registered with the agent.
"""

import logging

logger = logging.getLogger(__name__)


async def audit_excel(file_bytes: bytes, filename: str) -> str:
    """Audit an Excel file (.xlsx/.xls) — bank statement, balance sheet, or P&L.

    Args:
        file_bytes: Raw file content
        filename: Original filename for type detection
    Returns:
        HTML-formatted audit report
    """
    try:
        from telegram_bot.finance_auditor import audit_excel as _do_audit

        report = _do_audit(file_bytes, filename)
        return report
    except ImportError:
        return "❌ Finance auditor module unavailable. Please try again later."
    except Exception as e:
        logger.error("Excel audit failed: %s", e)
        return f"❌ Audit failed: {e}"


async def check_balance_sheet(
    total_assets: float,
    total_liabilities: float,
    equity: float,
) -> str:
    """Verify the accounting equation: Assets = Liabilities + Equity.

    Args:
        total_assets: Total assets value
        total_liabilities: Total liabilities value
        equity: Total equity value
    Returns:
        Analysis result
    """
    expected = total_liabilities + equity
    diff = abs(total_assets - expected)
    threshold = max(total_assets, expected) * 0.01  # 1% tolerance

    if diff <= threshold:
        return (
            f"✅ Balance sheet equation satisfied:\n"
            f"   Assets: ₹{total_assets:,.2f}\n"
            f"   = Liabilities (₹{total_liabilities:,.2f}) + Equity (₹{equity:,.2f})\n"
            f"   = ₹{expected:,.2f}\n"
            f"   Difference: ₹{diff:,.2f} (within 1% tolerance ✅)"
        )
    else:
        return (
            f"❌ Balance sheet MISMATCH:\n"
            f"   Assets: ₹{total_assets:,.2f}\n"
            f"   Liabilities + Equity: ₹{expected:,.2f}\n"
            f"   Difference: ₹{diff:,.2f}\n"
            f"   Yeh equation nahi mil raha — books mein kuch gadbad hai."
        )


async def detect_duplicates(transactions: list[dict]) -> str:
    """Detect potentially duplicate transactions in a list.

    Args:
        transactions: List of dicts with keys: date, description, amount
    Returns:
        Analysis with potential duplicates flagged
    """
    if not transactions:
        return "No transactions to analyze."

    seen = {}
    duplicates = []

    for i, tx in enumerate(transactions):
        key = (
            tx.get("date", ""),
            tx.get("amount", 0),
            tx.get("description", "").strip().lower(),
        )
        if key in seen:
            duplicates.append((seen[key], i, tx))
        else:
            seen[key] = i

    if not duplicates:
        return f"✅ {len(transactions)} transactions checked — no duplicates found."

    lines = [f"⚠️ Found {len(duplicates)} potential duplicate(s):"]
    for orig_idx, dup_idx, tx in duplicates:
        lines.append(
            f"  • #{orig_idx + 1} & #{dup_idx + 1}: ₹{tx['amount']:,.2f} on {tx.get('date', '?')} "
            f'— "{tx.get("description", "")}"'
        )
    return "\n".join(lines)


async def rent_roll_summary(properties: list[dict]) -> str:
    """Generate a rent roll summary for NOI portfolio analysis.

    Args:
        properties: List of dicts with keys: property_name, monthly_rent, tenant, status
    Returns:
        Summary table with totals
    """
    if not properties:
        return "No properties to analyze."

    total_rent = 0
    active_count = 0
    lines = ["📊 Rent Roll Summary", "─" * 40]

    for p in properties:
        rent = float(p.get("monthly_rent", 0))
        status = p.get("status", "active")
        total_rent += rent
        if status == "active":
            active_count += 1
        icon = "✅" if status == "active" else "❌" if status == "vacant" else "⚠️"
        lines.append(
            f"{icon} {p.get('tenant', '?')} @ {p.get('property_name', '?')} — "
            f"₹{rent:,.2f}/mo ({status})"
        )

    lines.extend(
        [
            "─" * 40,
            f"Active Properties: {active_count}",
            f"Total Monthly Rent: ₹{total_rent:,.2f}",
            f"Annual Run Rate: ₹{total_rent * 12:,.2f}",
        ]
    )
    return "\n".join(lines)


async def analyze_agreement_amounts(
    agreement_rent: float,
    actual_transactions: list[dict],
) -> str:
    """Compare agreement rent amounts with actual bank transactions.

    Args:
        agreement_rent: Monthly rent as per agreement
        actual_transactions: List of rent payment transactions
    Returns:
        Mismatch analysis
    """
    if not actual_transactions:
        return "No transactions to compare against."

    expected = agreement_rent
    mismatches = []
    on_time = 0
    total_received = 0

    for tx in actual_transactions:
        amount = float(tx.get("amount", 0))
        total_received += amount
        if abs(amount - expected) > 50:
            mismatches.append((tx, amount, abs(amount - expected)))
        else:
            on_time += 1

    lines = [
        "📋 Agreement Amount Analysis",
        f"   Expected monthly: ₹{expected:,.2f}",
        f"   Periods checked: {len(actual_transactions)}",
        f"   Correct payments: {on_time}",
        f"   Total received: ₹{total_received:,.2f}",
    ]

    if mismatches:
        lines.append(f"\n⚠️ Mismatches found ({len(mismatches)}):")
        for tx, amt, diff in mismatches[:5]:
            lines.append(
                f"  • {tx.get('date', '?')}: ₹{amt:,.2f} "
                f"(diff: ₹{diff:,.2f}) — {tx.get('description', '')}"
            )
    else:
        lines.append("\n✅ All payments match agreement amount.")

    return "\n".join(lines)
