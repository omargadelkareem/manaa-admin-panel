import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Edit3,
  LocateFixed,
  MapPin,
  Save,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import PageHeader from "../../components/layout/PageHeader.jsx";
import LoadingScreen from "../../components/common/LoadingScreen.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

import { subscribeToEmployees } from "../../services/firebase/employees.service.js";

import {
  assignLocationToEmployees,
  createAttendanceLocation,
  deleteAttendanceLocation,
  subscribeToAttendanceLocations,
  updateAttendanceLocation,
} from "../../services/firebase/attendanceLocations.service.js";

const RIYADH_CENTER = [24.7136, 46.6753];
const DEFAULT_RADIUS = 500;

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function employeeBranch(employee) {
  return String(
    employee?.work_area ||
      employee?.current_location_name ||
      employee?.department_name ||
      ""
  ).trim();
}

function MapClick({ onChange }) {
  useMapEvents({
    click(event) {
      onChange(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });

  return null;
}

function MapFocus({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    if (lat == null || lng == null) {
      return;
    }

    map.flyTo(
      [lat, lng],
      16,
      {
        duration: 0.5,
      }
    );
  }, [lat, lng, map]);

  return null;
}

export default function LocationsPage() {
  const [locations, setLocations] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [locationsReady, setLocationsReady] =
    useState(false);

  const [employeesReady, setEmployeesReady] =
    useState(false);

  const [mode, setMode] =
    useState("branch");

  const [branch, setBranch] =
    useState("");

  const [employeeKey, setEmployeeKey] =
    useState("");

  const [employeeSearch, setEmployeeSearch] =
    useState("");

  const [name, setName] =
    useState("");

  const [lat, setLat] =
    useState(null);

  const [lng, setLng] =
    useState(null);

  const [radius, setRadius] =
    useState(DEFAULT_RADIUS);

  const [editingId, setEditingId] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    const unsubscribeLocations =
      subscribeToAttendanceLocations(
        (data) => {
          setLocations(data);
          setLocationsReady(true);
        },
        (firebaseError) => {
          console.error(firebaseError);
          setError(
            firebaseError?.message ||
              "تعذر تحميل مواقع البصمة."
          );
          setLocationsReady(true);
        }
      );

    const unsubscribeEmployees =
      subscribeToEmployees(
        (data) => {
          setEmployees(data);
          setEmployeesReady(true);
        },
        (firebaseError) => {
          console.error(firebaseError);
          setError(
            firebaseError?.message ||
              "تعذر تحميل الموظفين."
          );
          setEmployeesReady(true);
        }
      );

    return () => {
      unsubscribeLocations?.();
      unsubscribeEmployees?.();
    };
  }, []);

  const branches = useMemo(() => {
    const map = new Map();

    employees.forEach((employee) => {
      const value =
        employeeBranch(employee);

      if (!value) {
        return;
      }

      map.set(
        value,
        (map.get(value) || 0) + 1
      );
    });

    return [...map.entries()]
      .map(
        ([branchName, count]) => ({
          name: branchName,
          count,
        })
      )
      .sort((a, b) =>
        a.name.localeCompare(
          b.name,
          "ar"
        )
      );
  }, [employees]);

  const branchEmployees =
    useMemo(
      () =>
        employees.filter(
          (employee) =>
            employeeBranch(employee) ===
            branch
        ),
      [employees, branch]
    );

  const filteredEmployees =
    useMemo(() => {
      const query =
        employeeSearch
          .trim()
          .toLowerCase();

      return employees.filter(
        (employee) => {
          if (!query) {
            return true;
          }

          return [
            employee.name,
            employee.emp_code,
            employee.position_name,
            employeeBranch(employee),
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [
      employees,
      employeeSearch,
    ]);

  const selectedEmployee =
    employees.find(
      (employee) =>
        String(employee.firebaseKey) ===
        String(employeeKey)
    );

  const targetEmployees =
    mode === "branch"
      ? branchEmployees
      : selectedEmployee
        ? [selectedEmployee]
        : [];

  const filteredLocations =
    locations.filter((location) =>
      String(location.name || "")
        .toLowerCase()
        .includes(
          search
            .trim()
            .toLowerCase()
        )
    );

  function resetForm() {
    setEditingId(null);
    setName("");
    setLat(null);
    setLng(null);
    setRadius(DEFAULT_RADIUS);
    setMode("branch");
    setBranch("");
    setEmployeeKey("");
    setEmployeeSearch("");
    setMessage("");
    setError("");
  }

  function useCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "المتصفح لا يدعم تحديد الموقع."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(
          position.coords.latitude
        );

        setLng(
          position.coords.longitude
        );
      },
      () => {
        setError(
          "تعذر تحديد موقعك. اختر الموقع من الخريطة."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      }
    );
  }

  function editLocation(location) {
    setMessage("");
    setError("");

    setEditingId(
      location.firebaseKey
    );

    setName(
      location.name || ""
    );

    setLat(
      Number(location.latitude)
    );

    setLng(
      Number(location.longitude)
    );

    setRadius(
      Number(
        location.radius ||
          DEFAULT_RADIUS
      )
    );

    const assigned =
      employees.filter(
        (employee) =>
          String(
            employee.attendance_location_id ||
              ""
          ) ===
          String(
            location.firebaseKey
          )
      );

    if (assigned.length === 1) {
      setMode("employee");

      setEmployeeKey(
        assigned[0].firebaseKey
      );

      setBranch("");
    } else if (
      assigned.length > 1
    ) {
      const branchNames = [
        ...new Set(
          assigned
            .map(employeeBranch)
            .filter(Boolean)
        ),
      ];

      if (
        branchNames.length === 1
      ) {
        const branchName =
          branchNames[0];

        const allBranchEmployees =
          employees.filter(
            (employee) =>
              employeeBranch(employee) ===
              branchName
          );

        const completeBranch =
          allBranchEmployees.length > 0 &&
          allBranchEmployees.every(
            (employee) =>
              assigned.some(
                (item) =>
                  String(
                    item.firebaseKey
                  ) ===
                  String(
                    employee.firebaseKey
                  )
              )
          );

        if (completeBranch) {
          setMode("branch");
          setBranch(branchName);
          setEmployeeKey("");
        } else {
          setMode("employee");
          setEmployeeKey(
            assigned[0]
              ?.firebaseKey || ""
          );
          setBranch("");
        }
      } else {
        setMode("employee");
        setEmployeeKey(
          assigned[0]
            ?.firebaseKey || ""
        );
        setBranch("");
      }
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function save() {
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError(
        "اكتب اسم موقع البصمة."
      );
      return;
    }

    if (
      lat == null ||
      lng == null
    ) {
      setError(
        "حدد الموقع على الخريطة."
      );
      return;
    }

    if (!targetEmployees.length) {
      setError(
        mode === "branch"
          ? "اختر الفرع."
          : "اختر الموظف."
      );
      return;
    }

    if (
      !Number.isFinite(
        Number(radius)
      ) ||
      Number(radius) < 20
    ) {
      setError(
        "نطاق البصمة يجب ألا يقل عن 20 متر."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        latitude: Number(lat),
        longitude: Number(lng),
        radius: Number(radius),
      };

      let locationId =
        editingId;

      if (editingId) {
        await updateAttendanceLocation(
          editingId,
          payload
        );
      } else {
        const created =
          await createAttendanceLocation(
            payload
          );

        locationId =
          typeof created ===
          "string"
            ? created
            : created?.firebaseKey;
      }

      if (!locationId) {
        throw new Error(
          "تعذر الحصول على معرف موقع البصمة."
        );
      }

      await assignLocationToEmployees(
        targetEmployees.map(
          (employee) =>
            employee.firebaseKey
        ),
        locationId
      );

      setMessage(
        mode === "branch"
          ? `تم حفظ موقع البصمة وتعيينه لـ ${targetEmployees.length} موظف في فرع ${branch}.`
          : `تم حفظ موقع البصمة وتعيينه للموظف ${selectedEmployee?.name || ""}.`
      );

      setEditingId(
        locationId
      );
    } catch (saveError) {
      console.error(
        saveError
      );

      setError(
        saveError?.message ||
          "حدث خطأ أثناء حفظ موقع البصمة."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeLocation(
    location
  ) {
    const confirmed =
      window.confirm(
        `هل تريد حذف موقع البصمة "${location.name}"؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await deleteAttendanceLocation(
        location.firebaseKey
      );

      if (
        editingId ===
        location.firebaseKey
      ) {
        resetForm();
      }

      setMessage(
        "تم حذف موقع البصمة."
      );
    } catch (deleteError) {
      console.error(
        deleteError
      );

      setError(
        deleteError?.message ||
          "تعذر حذف موقع البصمة."
      );
    }
  }

  if (
    !locationsReady ||
    !employeesReady
  ) {
    return (
      <LoadingScreen text="جاري تحميل مواقع البصمة..." />
    );
  }

  return (
    <div className="page-stack direct-location-page">
      <PageHeader
        title="مواقع البصمة"
        subtitle="حدد مكان البصمة ونطاق السماح ثم طبقه على فرع كامل أو موظف محدد."
      />

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="direct-success">
          <Check size={18} />
          <span>{message}</span>
        </div>
      )}

      <section className="panel direct-location-form">
        <div className="direct-location-heading">
          <div className="direct-location-icon">
            <MapPin size={22} />
          </div>

          <div>
            <h2>
              {editingId
                ? "تعديل موقع البصمة"
                : "تحديد موقع البصمة"}
            </h2>

            <p>
              اختر الفرع أو الموظف ثم حدد الموقع على الخريطة.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="button button-ghost"
              onClick={resetForm}
            >
              <X size={16} />
              إلغاء التعديل
            </button>
          )}
        </div>

        <div className="direct-target-tabs">
          <button
            type="button"
            className={
              mode === "branch"
                ? "active"
                : ""
            }
            onClick={() => {
              setMode("branch");
              setEmployeeKey("");
              setError("");
            }}
          >
            <Building2 size={19} />

            <span>
              فرع كامل
            </span>
          </button>

          <button
            type="button"
            className={
              mode === "employee"
                ? "active"
                : ""
            }
            onClick={() => {
              setMode("employee");
              setBranch("");
              setError("");
            }}
          >
            <UserRound size={19} />

            <span>
              موظف محدد
            </span>
          </button>
        </div>

        <div className="direct-location-grid">
          <div className="direct-location-fields">

            {mode === "branch" ? (
              <label className="field">
                <span>
                  الفرع
                </span>

                <select
                  value={branch}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setBranch(value);

                    if (!name.trim()) {
                      setName(value);
                    }
                  }}
                >
                  <option value="">
                    اختر الفرع
                  </option>

                  {branches.map(
                    (item) => (
                      <option
                        key={item.name}
                        value={item.name}
                      >
                        {item.name} —{" "}
                        {item.count} موظف
                      </option>
                    )
                  )}
                </select>

                {branch && (
                  <small className="direct-count">
                    سيتم تطبيق الموقع على{" "}
                    <strong>
                      {
                        branchEmployees.length
                      }
                    </strong>{" "}
                    موظف
                  </small>
                )}
              </label>
            ) : (
              <>
                <label className="field">
                  <span>
                    البحث عن الموظف
                  </span>

                  <div className="assignment-search-input">
                    <Search
                      size={17}
                    />

                    <input
                      value={
                        employeeSearch
                      }
                      onChange={(
                        event
                      ) =>
                        setEmployeeSearch(
                          event.target
                            .value
                        )
                      }
                      placeholder="الاسم أو كود الموظف"
                    />
                  </div>
                </label>

                <label className="field">
                  <span>
                    الموظف
                  </span>

                  <select
                    value={employeeKey}
                    onChange={(event) =>
                      setEmployeeKey(
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      اختر الموظف
                    </option>

                    {filteredEmployees.map(
                      (employee) => (
                        <option
                          key={
                            employee.firebaseKey
                          }
                          value={
                            employee.firebaseKey
                          }
                        >
                          {employee.name ||
                            "بدون اسم"}
                          {" — "}
                          {employee.emp_code ||
                            "بدون كود"}
                          {" — "}
                          {employeeBranch(
                            employee
                          ) ||
                            "بدون فرع"}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </>
            )}

            <label className="field">
              <span>
                اسم موقع البصمة
              </span>

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="مثال: دبل الرياض"
              />
            </label>

            <div className="direct-radius">
              <div>
                <span>
                  نطاق البصمة
                </span>

                <strong>
                  {radius} متر
                </strong>
              </div>

              <input
                type="range"
                min="20"
                max="3000"
                step="10"
                value={radius}
                onChange={(event) =>
                  setRadius(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              />

              <div className="direct-radius-presets">
                {[100, 250, 500, 1000, 2000].map(
                  (value) => (
                    <button
                      type="button"
                      key={value}
                      className={
                        Number(radius) ===
                        value
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setRadius(value)
                      }
                    >
                      {value >= 1000
                        ? `${value / 1000} كم`
                        : `${value} م`}
                    </button>
                  )
                )}
              </div>
            </div>

            <button
              type="button"
              className="button button-ghost"
              onClick={
                useCurrentLocation
              }
            >
              <LocateFixed
                size={17}
              />
              استخدام موقعي الحالي
            </button>

            <div className="location-coordinates">
              <div>
                <span>
                  Latitude
                </span>

                <strong>
                  {lat == null
                    ? "—"
                    : Number(
                        lat
                      ).toFixed(6)}
                </strong>
              </div>

              <div>
                <span>
                  Longitude
                </span>

                <strong>
                  {lng == null
                    ? "—"
                    : Number(
                        lng
                      ).toFixed(6)}
                </strong>
              </div>
            </div>
          </div>

          <div className="direct-map-wrap">
            <MapContainer
              center={
                lat != null &&
                lng != null
                  ? [lat, lng]
                  : RIYADH_CENTER
              }
              zoom={
                lat != null
                  ? 16
                  : 11
              }
              className="direct-location-map"
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapClick
                onChange={(
                  latitude,
                  longitude
                ) => {
                  setLat(latitude);
                  setLng(longitude);
                }}
              />

              <MapFocus
                lat={lat}
                lng={lng}
              />

              {lat != null &&
                lng != null && (
                  <>
                    <Circle
                      center={[
                        lat,
                        lng,
                      ]}
                      radius={
                        Number(
                          radius
                        ) ||
                        DEFAULT_RADIUS
                      }
                      pathOptions={{
                        weight: 2,
                        fillOpacity:
                          0.12,
                      }}
                    />

                    <Marker
                      position={[
                        lat,
                        lng,
                      ]}
                      icon={
                        markerIcon
                      }
                      draggable
                      eventHandlers={{
                        dragend(
                          event
                        ) {
                          const point =
                            event.target.getLatLng();

                          setLat(
                            point.lat
                          );

                          setLng(
                            point.lng
                          );
                        },
                      }}
                    >
                      <Popup>
                        <div dir="rtl">
                          <strong>
                            {name ||
                              "موقع البصمة"}
                          </strong>

                          <br />

                          نطاق السماح:{" "}
                          {radius} متر
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
            </MapContainer>

            {lat == null && (
              <div className="map-empty-hint">
                <MapPin
                  size={30}
                />

                <strong>
                  حدد موقع البصمة
                </strong>

                <span>
                  اضغط على المكان المطلوب داخل الخريطة
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="direct-save-bar">
          <div>
            {mode === "branch" &&
              branch && (
                <span>
                  <Users
                    size={16}
                  />
                  {
                    branchEmployees.length
                  }{" "}
                  موظف في {branch}
                </span>
              )}

            {mode ===
              "employee" &&
              selectedEmployee && (
                <span>
                  <UserRound
                    size={16}
                  />
                  {
                    selectedEmployee.name
                  }
                </span>
              )}
          </div>

          <button
            type="button"
            className="button button-primary direct-save-button"
            onClick={save}
            disabled={saving}
          >
            <Save size={17} />

            {saving
              ? "جاري الحفظ..."
              : editingId
                ? "حفظ التعديلات"
                : "حفظ موقع البصمة"}
          </button>
        </div>
      </section>

      <section className="panel saved-locations-panel">
        <div className="locations-toolbar">
          <div>
            <h2>
              مواقع البصمة المحفوظة
            </h2>

            <p>
              {locations.length} موقع
            </p>
          </div>

          <div className="search-box">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="بحث في المواقع..."
            />
          </div>
        </div>

        {filteredLocations.length ===
        0 ? (
          <EmptyState
            title="لا توجد مواقع بصمة"
            description="حدد أول موقع بصمة من النموذج بالأعلى."
          />
        ) : (
          <div className="simple-saved-locations">
            {filteredLocations.map(
              (location) => {
                const assignedCount =
                  employees.filter(
                    (employee) =>
                      String(
                        employee.attendance_location_id ||
                          ""
                      ) ===
                      String(
                        location.firebaseKey
                      )
                  ).length;

                return (
                  <article
                    key={
                      location.firebaseKey
                    }
                    className="saved-location-card"
                  >
                    <div className="saved-location-main">
                      <div className="saved-pin">
                        <MapPin
                          size={20}
                        />
                      </div>

                      <div>
                        <strong>
                          {location.name ||
                            "بدون اسم"}
                        </strong>

                        <span>
                          نطاق البصمة:{" "}
                          {Number(
                            location.radius ||
                              DEFAULT_RADIUS
                          )}{" "}
                          متر
                        </span>

                        <span>
                          {assignedCount} موظف مرتبط بالموقع
                        </span>
                      </div>
                    </div>

                    <div className="saved-location-actions">
                      <button
                        type="button"
                        className="button button-ghost"
                        onClick={() =>
                          editLocation(
                            location
                          )
                        }
                      >
                        <Edit3
                          size={15}
                        />
                        تعديل
                      </button>

                      <button
                        type="button"
                        className="button button-ghost location-delete-button"
                        onClick={() =>
                          removeLocation(
                            location
                          )
                        }
                      >
                        <Trash2
                          size={15}
                        />
                        حذف
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}
