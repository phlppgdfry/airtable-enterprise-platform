# 🧮 Airtable Formula Masterclass for Senior Architects

Airtable formulas execute on the client and server. Mastering formulas is essential for clean interface presentation, automated validation, and derived analytics.

---

## 1. Dynamic ASCII Progress Bar
Creates a graphical 10-segment bar:
```airtable
REPT("█", ROUND({Progress %} * 10, 0)) & REPT("░", 10 - ROUND({Progress %} * 10, 0)) & " " & ROUND({Progress %} * 100, 0) & "%"
```
*Output:* `████████░░ 80%`

---

## 2. Multi-State Project Health Traffic Light
Evaluates milestones against today's date and delivery status:
```airtable
IF({Status} = "Delivered", "🟢 Delivered",
  IF(AND(IS_BEFORE({Target Go-Live}, TODAY()), {Status} != "Delivered"),
    "🔴 Overdue (" & DATETIME_DIFF(TODAY(), {Target Go-Live}, "days") & "d)",
    IF(DATETIME_DIFF({Target Go-Live}, TODAY(), "days") <= 7,
      "🟡 Due Soon (" & DATETIME_DIFF({Target Go-Live}, TODAY(), "days") & "d remaining)",
      "🔵 On Track"
    )
  )
)
```

---

## 3. Fiscal Quarter & Fiscal Year (Calendar or Custom)
```airtable
"FY" & DATETIME_FORMAT({Target Go-Live}, "YY") & "-Q" & DATETIME_FORMAT({Target Go-Live}, "Q")
```
*Output:* `FY26-Q4`

---

## 4. Net Working Days (Excluding Weekends)
```airtable
IF(AND({Start Date}, {Target Go-Live}),
  WORKDAY_DIFF({Start Date}, {Target Go-Live}) & " working days",
  "Pending Dates"
)
```

---

## 5. Budget Variance & Spending Burn Rate
```airtable
IF(OR({Budget Allocated (€)} = 0, IS_EMPTY({Budget Allocated (€)})), "No Budget Set",
  IF({Budget Spent (€)} > {Budget Allocated (€)},
    "⚠️ Over budget by €" & ({Budget Spent (€)} - {Budget Allocated (€)}),
    "✅ Surplus €" & ({Budget Allocated (€)} - {Budget Spent (€)}) & " (" & ROUND(({Budget Spent (€)} / {Budget Allocated (€)}) * 100, 1) & "% spent)"
  )
)
```
