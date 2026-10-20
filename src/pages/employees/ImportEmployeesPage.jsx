import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  XCircle,
} from "lucide-react";

import * as XLSX from "xlsx";

import PageHeader from "../../components/layout/PageHeader.jsx";

import {
  importEmployeesBatch,
} from "../../services/firebase/employees.service.js";

const aliases = {
  emp_code: [
    "emp_code",
    "employee_code",
    "code",
    "كود الموظف",
    "الكود",
    "رقم الموظف",
  ],

  name: [
    "name",
    "employee_name",
    "الاسم",
    "اسم الموظف",
  ],

  department_name: [
    "department_name",
    "department",
    "القسم",
    "اسم القسم",
  ],

  position_name: [
    "position_name",
    "position",
    "job_title",
    "المسمى الوظيفي",
    "الوظيفة",
  ],

  work_area: [
    "work_area",
    "location",
    "branch",
    "منطقة العمل",
    "الفرع",
    "الموقع",
  ],

  phone: [
    "phone",
    "mobile",
    "الهاتف",
    "رقم الهاتف",
    "الجوال",
  ],

  email: [
    "email",
    "البريد الإلكتروني",
    "البريد",
  ],

  national_id: [
    "national_id",
    "nationalid",
    "رقم الهوية",
    "الرقم القومي",
  ],

  hire_date: [
    "hire_date",
    "hiredate",
    "تاريخ التعيين",
  ],

  address: [
    "address",
    "العنوان",
  ],
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function findValue(row, field) {
  const fieldAliases =
    aliases[field].map(normalizeHeader);

  for (const [key, value] of Object.entries(row)) {
    if (
      fieldAliases.includes(
        normalizeHeader(key)
      )
    ) {
      return value;
    }
  }

  return "";
}

function normalizeDate(value) {
  if (!value) return "";

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return `${parsed.y}-${String(
        parsed.m
      ).padStart(2, "0")}-${String(
        parsed.d
      ).padStart(2, "0")}`;
    }
  }

  return String(value).trim();
}

function mapRow(row) {
  const workArea = String(
    findValue(row, "work_area") || ""
  ).trim();

  return {
    emp_code: String(
      findValue(row, "emp_code") || ""
    ).trim(),

    name: String(
      findValue(row, "name") || ""
    ).trim(),

    department_name: String(
      findValue(row, "department_name") || ""
    ).trim(),

    position_name: String(
      findValue(row, "position_name") || ""
    ).trim(),

    work_area: workArea,

    current_location_name: workArea,

    phone: String(
      findValue(row, "phone") || ""
    ).trim(),

    email: String(
      findValue(row, "email") || ""
    ).trim(),

    national_id: String(
      findValue(row, "national_id") || ""
    ).trim(),

    hire_date: normalizeDate(
      findValue(row, "hire_date")
    ),

    address: String(
      findValue(row, "address") || ""
    ).trim(),

    app_role: "موظف",
    app_status: "نشط",
    is_active: true,
    fingerprint: "",
    password: "",
    password_created: false,
    last_name: "",
  };
}

export default function ImportEmployeesPage() {
  const inputRef = useRef(null);

  const [fileName, setFileName] =
    useState("");

  const [rows, setRows] =
    useState([]);

  const [importing, setImporting] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const validRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.emp_code &&
          row.name
      ),
    [rows]
  );

  const invalidRows =
    rows.length - validRows.length;

  async function handleFile(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setResult(null);

    const buffer =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(buffer);

    const firstSheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const json =
      XLSX.utils.sheet_to_json(
        firstSheet,
        {
          defval: "",
        }
      );

    setRows(json.map(mapRow));
  }

  async function handleImport() {
    if (!validRows.length) return;

    setImporting(true);
    setResult(null);

    try {
      const response =
        await importEmployeesBatch(
          validRows
        );

      setResult(response);
    } catch (error) {
      setResult({
        imported: [],
        skipped: [],
        failed: [
          {
            reason: error.message,
          },
        ],
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="استيراد الموظفين"
        description="رفع الموظفين جماعيًا من ملف Excel"
      />

      <section
        className="upload-zone"
        onClick={() =>
          inputRef.current?.click()
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={handleFile}
        />

        <div className="upload-icon">
          <Upload size={28} />
        </div>

        <h2>
          اختر ملف Excel
        </h2>

        <p>
          يدعم XLSX و XLS
        </p>

        {fileName && (
          <span className="selected-file">
            <FileSpreadsheet size={17} />
            {fileName}
          </span>
        )}
      </section>

      {rows.length > 0 && (
        <>
          <section className="import-summary">
            <div>
              <CheckCircle2 size={20} />
              <span>
                صالح للاستيراد
              </span>
              <strong>
                {validRows.length}
              </strong>
            </div>

            <div>
              <AlertTriangle size={20} />
              <span>
                بيانات ناقصة
              </span>
              <strong>
                {invalidRows}
              </strong>
            </div>

            <div>
              <FileSpreadsheet size={20} />
              <span>
                إجمالي الصفوف
              </span>
              <strong>
                {rows.length}
              </strong>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  معاينة البيانات
                </h2>

                <p>
                  لن يتم استيراد صف بدون
                  الاسم وكود الموظف.
                </p>
              </div>

              <button
                type="button"
                className="button button-primary"
                disabled={
                  importing ||
                  validRows.length === 0
                }
                onClick={handleImport}
              >
                {importing
                  ? "جاري الاستيراد..."
                  : `استيراد ${validRows.length} موظف`}
              </button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الحالة</th>
                    <th>الكود</th>
                    <th>الاسم</th>
                    <th>القسم</th>
                    <th>الوظيفة</th>
                    <th>منطقة العمل</th>
                    <th>الهاتف</th>
                  </tr>
                </thead>

                <tbody>
                  {rows
                    .slice(0, 100)
                    .map((row, index) => {
                      const valid =
                        row.emp_code &&
                        row.name;

                      return (
                        <tr key={index}>
                          <td>
                            {valid ? (
                              <CheckCircle2
                                size={18}
                                className="success-icon"
                              />
                            ) : (
                              <XCircle
                                size={18}
                                className="danger-icon"
                              />
                            )}
                          </td>

                          <td>
                            {row.emp_code ||
                              "—"}
                          </td>

                          <td>
                            {row.name || "—"}
                          </td>

                          <td>
                            {row.department_name ||
                              "—"}
                          </td>

                          <td>
                            {row.position_name ||
                              "—"}
                          </td>

                          <td>
                            {row.work_area ||
                              "—"}
                          </td>

                          <td>
                            {row.phone || "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {rows.length > 100 && (
              <div className="table-note">
                يتم عرض أول 100 صف فقط
                للمعاينة.
              </div>
            )}
          </section>
        </>
      )}

      {result && (
        <section className="import-result panel">
          <h2>نتيجة الاستيراد</h2>

          <div className="import-result-grid">
            <div>
              <span>تم الاستيراد</span>
              <strong>
                {result.imported.length}
              </strong>
            </div>

            <div>
              <span>تم التجاوز</span>
              <strong>
                {result.skipped.length}
              </strong>
            </div>

            <div>
              <span>فشل</span>
              <strong>
                {result.failed.length}
              </strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
