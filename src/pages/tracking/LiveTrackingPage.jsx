import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Circle,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Radio,
  Route,
  Search,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import PageHeader from "../../components/layout/PageHeader.jsx";
import LoadingScreen from "../../components/common/LoadingScreen.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";

import {
  subscribeToEmployees,
} from "../../services/firebase/employees.service.js";

import {
  subscribeToEmployeeTracking,
} from "../../services/firebase/tracking.service.js";

const DEFAULT_CENTER = [
  24.7136,
  46.6753,
];

const DEFAULT_ZOOM = 11;

const ONLINE_WINDOW =
  5 * 60 * 1000;

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

function getTimestamp(point) {
  if (!point) return 0;

  const value = Number(
    point.timestamp ||
      point.pointKey ||
      0
  );

  return Number.isFinite(value)
    ? value
    : 0;
}

function isOnline(point) {
  const timestamp =
    getTimestamp(point);

  if (!timestamp) return false;

  return (
    Date.now() - timestamp <=
    ONLINE_WINDOW
  );
}

function formatDateTime(timestamp) {
  if (!timestamp) return "—";

  try {
    return new Intl.DateTimeFormat(
      "ar-SA",
      {
        dateStyle: "short",
        timeStyle: "medium",
      }
    ).format(new Date(timestamp));
  } catch {
    return "—";
  }
}

function formatTime(timestamp) {
  if (!timestamp) return "—";

  try {
    return new Intl.DateTimeFormat(
      "ar-SA",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    ).format(new Date(timestamp));
  } catch {
    return "—";
  }
}

function isSameDay(timestamp, date) {
  if (!timestamp) return false;

  const pointDate =
    new Date(timestamp);

  return (
    pointDate.getFullYear() ===
      date.getFullYear() &&
    pointDate.getMonth() ===
      date.getMonth() &&
    pointDate.getDate() ===
      date.getDate()
  );
}

function distanceMeters(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 6371000;

  const toRad = (value) =>
    (value * Math.PI) / 180;

  const dLat = toRad(
    lat2 - lat1
  );

  const dLon = toRad(
    lon2 - lon1
  );

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

function calculateDistance(points) {
  if (!points || points.length < 2) {
    return 0;
  }

  let total = 0;

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    const previous =
      points[index - 1];

    const current =
      points[index];

    total += distanceMeters(
      previous.latitude,
      previous.longitude,
      current.latitude,
      current.longitude
    );
  }

  return total;
}

function formatDistance(meters) {
  if (!meters) return "0 م";

  if (meters < 1000) {
    return `${Math.round(
      meters
    )} م`;
  }

  return `${(
    meters / 1000
  ).toFixed(2)} كم`;
}

function MapFocus({
  selectedTracking,
  showRoute,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      !selectedTracking?.lastPoint
    ) {
      return;
    }

    const point =
      selectedTracking.lastPoint;

    if (
      showRoute &&
      selectedTracking.routePoints
        ?.length > 1
    ) {
      const bounds =
        L.latLngBounds(
          selectedTracking.routePoints.map(
            (item) => [
              item.latitude,
              item.longitude,
            ]
          )
        );

      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 16,
      });

      return;
    }

    map.flyTo(
      [
        point.latitude,
        point.longitude,
      ],
      16,
      {
        duration: 0.7,
      }
    );
  }, [
    map,
    selectedTracking,
    showRoute,
  ]);

  return null;
}

export default function LiveTrackingPage() {
  const [employees, setEmployees] =
    useState([]);

  const [tracking, setTracking] =
    useState([]);

  const [employeesReady, setEmployeesReady] =
    useState(false);

  const [trackingReady, setTrackingReady] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [
    selectedFirebaseKey,
    setSelectedFirebaseKey,
  ] = useState(null);

  const [showRoute, setShowRoute] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(Date.now());

  const listRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(
      () => {
        setCurrentTime(Date.now());
      },
      30000
    );

    return () =>
      clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribeEmployees =
      subscribeToEmployees(
        (data) => {
          setEmployees(data);
          setEmployeesReady(true);
        },
        (firebaseError) => {
          console.error(
            firebaseError
          );

          setError(
            firebaseError.message
          );

          setEmployeesReady(true);
        }
      );

    const unsubscribeTracking =
      subscribeToEmployeeTracking(
        (data) => {
          setTracking(data);
          setTrackingReady(true);
        },
        (firebaseError) => {
          console.error(
            firebaseError
          );

          setError(
            firebaseError.message
          );

          setTrackingReady(true);
        }
      );

    return () => {
      unsubscribeEmployees();
      unsubscribeTracking();
    };
  }, []);

  const employeeByFirebaseKey =
    useMemo(() => {
      const map = new Map();

      employees.forEach(
        (employee) => {
          map.set(
            String(
              employee.firebaseKey
            ),
            employee
          );
        }
      );

      return map;
    }, [employees]);

  const trackingWithEmployees =
    useMemo(() => {
      return tracking.map(
        (trackingItem) => {
          const employee =
            employeeByFirebaseKey.get(
              String(
                trackingItem.firebaseEmployeeKey
              )
            ) || null;

          return {
            ...trackingItem,
            employee,
          };
        }
      );
    }, [
      tracking,
      employeeByFirebaseKey,
      currentTime,
    ]);

  const onlineCount =
    trackingWithEmployees.filter(
      (item) =>
        isOnline(item.lastPoint)
    ).length;

  const offlineCount =
    trackingWithEmployees.length -
    onlineCount;

  const todayPointsCount =
    useMemo(() => {
      const today = new Date();

      return trackingWithEmployees.reduce(
        (total, item) =>
          total +
          item.routePoints.filter(
            (point) =>
              isSameDay(
                point.timestamp,
                today
              )
          ).length,
        0
      );
    }, [
      trackingWithEmployees,
      currentTime,
    ]);

  const filteredTracking =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return trackingWithEmployees.filter(
        (item) => {
          const employee =
            item.employee;

          const online =
            isOnline(
              item.lastPoint
            );

          if (
            statusFilter ===
              "online" &&
            !online
          ) {
            return false;
          }

          if (
            statusFilter ===
              "offline" &&
            online
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const values = [
            employee?.name,
            employee?.emp_code,
            employee?.department_name,
            employee?.position_name,
            employee?.work_area,
            item.firebaseEmployeeKey,
            item.lastPoint
              ?.location_name,
          ];

          return values.some(
            (value) =>
              String(
                value || ""
              )
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [
      trackingWithEmployees,
      search,
      statusFilter,
      currentTime,
    ]);

  const selectedTracking =
    useMemo(() => {
      if (
        !selectedFirebaseKey
      ) {
        return null;
      }

      return (
        trackingWithEmployees.find(
          (item) =>
            String(
              item.firebaseEmployeeKey
            ) ===
            String(
              selectedFirebaseKey
            )
        ) || null
      );
    }, [
      selectedFirebaseKey,
      trackingWithEmployees,
    ]);

  const todayRoute =
    useMemo(() => {
      if (!selectedTracking) {
        return [];
      }

      const today =
        new Date();

      return selectedTracking.routePoints.filter(
        (point) =>
          isSameDay(
            point.timestamp,
            today
          )
      );
    }, [
      selectedTracking,
      currentTime,
    ]);

  const selectedRoute =
    todayRoute.length > 0
      ? todayRoute
      : selectedTracking?.routePoints ||
        [];

  const routeDistance =
    useMemo(
      () =>
        calculateDistance(
          selectedRoute
        ),
      [selectedRoute]
    );

  const loading =
    !employeesReady ||
    !trackingReady;

  if (loading) {
    return (
      <LoadingScreen text="جاري تشغيل التتبع المباشر..." />
    );
  }

  function selectEmployee(item) {
    setSelectedFirebaseKey(
      item.firebaseEmployeeKey
    );

    setShowRoute(false);
  }

  return (
    <div className="page live-tracking-page">
      <PageHeader
        title="التتبع المباشر"
        description="متابعة مواقع وتحركات الموظفين لحظيًا"
        actions={
          <div className="live-indicator">
            <span />
            مباشر الآن
          </div>
        }
      />

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <section className="tracking-stats">
        <article>
          <div className="tracking-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <span>
              موظفون متتبعون
            </span>

            <strong>
              {
                trackingWithEmployees.length
              }
            </strong>
          </div>
        </article>

        <article>
          <div className="tracking-stat-icon online">
            <Wifi size={20} />
          </div>

          <div>
            <span>
              متصل الآن
            </span>

            <strong>
              {onlineCount}
            </strong>
          </div>
        </article>

        <article>
          <div className="tracking-stat-icon offline">
            <WifiOff size={20} />
          </div>

          <div>
            <span>
              غير متصل
            </span>

            <strong>
              {offlineCount}
            </strong>
          </div>
        </article>

        <article>
          <div className="tracking-stat-icon">
            <Route size={20} />
          </div>

          <div>
            <span>
              نقاط اليوم
            </span>

            <strong>
              {todayPointsCount}
            </strong>
          </div>
        </article>
      </section>

      {trackingWithEmployees.length ===
      0 ? (
        <EmptyState
          title="لا توجد بيانات تتبع"
          description="لا توجد route_points مسجلة حاليًا داخل employee_tracking."
        />
      ) : (
        <section className="live-tracking-layout">
          <div className="tracking-map-panel">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              scrollWheelZoom
              className="tracking-map"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFocus
                selectedTracking={
                  selectedTracking
                }
                showRoute={
                  showRoute
                }
              />

              {filteredTracking.map(
                (item) => {
                  const point =
                    item.lastPoint;

                  if (!point) {
                    return null;
                  }

                  const employee =
                    item.employee;

                  const online =
                    isOnline(point);

                  return (
                    <Marker
                      key={
                        item.firebaseEmployeeKey
                      }
                      position={[
                        point.latitude,
                        point.longitude,
                      ]}
                      icon={
                        markerIcon
                      }
                      eventHandlers={{
                        click: () =>
                          selectEmployee(
                            item
                          ),
                      }}
                    >
                      <Popup>
                        <div
                          className="map-popup"
                          dir="rtl"
                        >
                          <strong>
                            {employee?.name ||
                              `موظف ${item.firebaseEmployeeKey}`}
                          </strong>

                          <span>
                            الكود:{" "}
                            {employee?.emp_code ||
                              "—"}
                          </span>

                          <span>
                            {employee?.position_name ||
                              "موظف"}
                          </span>

                          <span>
                            {online
                              ? "متصل الآن"
                              : "غير متصل"}
                          </span>

                          <span>
                            آخر تحديث:{" "}
                            {formatTime(
                              point.timestamp
                            )}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
              )}

              {showRoute &&
                selectedRoute.length >
                  1 && (
                  <>
                    <Polyline
                      positions={selectedRoute.map(
                        (point) => [
                          point.latitude,
                          point.longitude,
                        ]
                      )}
                      weight={5}
                    />

                    <CircleMarker
                      center={[
                        selectedRoute[0]
                          .latitude,
                        selectedRoute[0]
                          .longitude,
                      ]}
                      radius={8}
                    >
                      <Popup>
                        بداية المسار
                        <br />
                        {formatTime(
                          selectedRoute[0]
                            .timestamp
                        )}
                      </Popup>
                    </CircleMarker>

                    <CircleMarker
                      center={[
                        selectedRoute[
                          selectedRoute.length -
                            1
                        ].latitude,
                        selectedRoute[
                          selectedRoute.length -
                            1
                        ].longitude,
                      ]}
                      radius={9}
                    >
                      <Popup>
                        آخر نقطة
                        <br />
                        {formatTime(
                          selectedRoute[
                            selectedRoute.length -
                              1
                          ].timestamp
                        )}
                      </Popup>
                    </CircleMarker>
                  </>
                )}
            </MapContainer>

            {selectedTracking && (
              <div className="selected-employee-bar">
                <div className="selected-employee-main">
                  <div className="mini-avatar">
                    {(
                      selectedTracking
                        .employee?.name ||
                      "م"
                    ).charAt(0)}
                  </div>

                  <div>
                    <strong>
                      {selectedTracking
                        .employee?.name ||
                        `موظف ${selectedTracking.firebaseEmployeeKey}`}
                    </strong>

                    <span>
                      {selectedTracking
                        .employee
                        ?.position_name ||
                        "موظف"}
                      {" • "}
                      {selectedTracking
                        .employee
                        ?.department_name ||
                        "بدون قسم"}
                    </span>
                  </div>
                </div>

                <div className="selected-location-data">
                  <span>
                    <Clock3 size={15} />
                    {formatDateTime(
                      selectedTracking
                        .lastPoint
                        ?.timestamp
                    )}
                  </span>

                  <span>
                    <LocateFixed
                      size={15}
                    />

                    الدقة:{" "}
                    {selectedTracking
                      .lastPoint
                      ?.accuracy !==
                    null
                      ? `${Math.round(
                          selectedTracking
                            .lastPoint
                            .accuracy
                        )} م`
                      : "—"}
                  </span>

                  <span>
                    <Route size={15} />

                    {formatDistance(
                      routeDistance
                    )}
                  </span>
                </div>

                <div className="selected-actions">
                  <button
                    type="button"
                    className={`button ${
                      showRoute
                        ? "button-primary"
                        : "button-ghost"
                    }`}
                    onClick={() =>
                      setShowRoute(
                        (value) =>
                          !value
                      )
                    }
                  >
                    <Route size={16} />

                    {showRoute
                      ? "إخفاء المسار"
                      : "مسار اليوم"}
                  </button>

                  {selectedTracking
                    .lastPoint && (
                    <a
                      className="button button-ghost"
                      href={`https://www.google.com/maps?q=${selectedTracking.lastPoint.latitude},${selectedTracking.lastPoint.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation
                        size={16}
                      />
                      فتح الموقع
                    </a>
                  )}

                  <button
                    type="button"
                    className="tracking-close-selection"
                    onClick={() => {
                      setSelectedFirebaseKey(
                        null
                      );
                      setShowRoute(
                        false
                      );
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside
            className="tracking-employees-panel"
            ref={listRef}
          >
            <div className="tracking-search">
              <Search size={17} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="ابحث عن موظف..."
              />
            </div>

            <div className="tracking-filters">
              <button
                type="button"
                className={
                  statusFilter ===
                  "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    "all"
                  )
                }
              >
                الكل
              </button>

              <button
                type="button"
                className={
                  statusFilter ===
                  "online"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    "online"
                  )
                }
              >
                متصل
              </button>

              <button
                type="button"
                className={
                  statusFilter ===
                  "offline"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(
                    "offline"
                  )
                }
              >
                غير متصل
              </button>
            </div>

            <div className="tracking-employee-list">
              {filteredTracking.map(
                (item) => {
                  const employee =
                    item.employee;

                  const point =
                    item.lastPoint;

                  const online =
                    isOnline(point);

                  const selected =
                    String(
                      selectedFirebaseKey
                    ) ===
                    String(
                      item.firebaseEmployeeKey
                    );

                  return (
                    <button
                      type="button"
                      key={
                        item.firebaseEmployeeKey
                      }
                      className={`tracking-employee-item ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        selectEmployee(
                          item
                        )
                      }
                    >
                      <div className="tracking-avatar">
                        {(
                          employee?.name ||
                          "م"
                        ).charAt(0)}

                        <span
                          className={
                            online
                              ? "online"
                              : "offline"
                          }
                        />
                      </div>

                      <div className="tracking-employee-copy">
                        <strong>
                          {employee?.name ||
                            `موظف ${item.firebaseEmployeeKey}`}
                        </strong>

                        <span>
                          {employee?.emp_code
                            ? `#${employee.emp_code}`
                            : ""}
                          {employee?.position_name
                            ? ` • ${employee.position_name}`
                            : ""}
                        </span>

                        <small>
                          <MapPin
                            size={12}
                          />

                          {point?.location_name ||
                            employee?.work_area ||
                            employee?.current_location_name ||
                            "موقع غير محدد"}
                        </small>
                      </div>

                      <div className="tracking-time">
                        <span
                          className={
                            online
                              ? "online"
                              : ""
                          }
                        >
                          {online
                            ? "مباشر"
                            : "Offline"}
                        </span>

                        <small>
                          {formatTime(
                            point?.timestamp
                          )}
                        </small>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
