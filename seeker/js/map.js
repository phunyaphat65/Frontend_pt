/**
 * seeker/js/map.js
 * ระบบจัดการแผนที่ Google Maps ฝั่งผู้สมัครงาน (Seeker)
 * รองรับ: ปักหมุด, ดึงที่อยู่, อัปเดตตำแหน่ง, ตรวจสอบสิทธิ์ใช้งาน
 */

(function () {
  const MAP_ID = "map";
  const LAT_ID = "latitude";
  const LNG_ID = "longitude";
  const ADDRESS_ID = "address";

  let map, marker, geocoder;

  /**
   * ✅ เริ่มต้นโหลดแผนที่
   */
  window.initMap = function () {
    try {
      const latInput = document.getElementById(LAT_ID);
      const lngInput = document.getElementById(LNG_ID);

      // พิกัดเริ่มต้น (กรุงเทพฯ)
      const defaultLocation = { lat: 13.7563, lng: 100.5018 };

      map = new google.maps.Map(document.getElementById(MAP_ID), {
        center: defaultLocation,
        zoom: 13,
        mapId: "SEEKER_MAP_STYLE",
        mapTypeControl: false,
        fullscreenControl: false,
      });

      geocoder = new google.maps.Geocoder();

      // ถ้ามีค่าพิกัดเก่า → ใช้ค่านั้น
      if (latInput?.value && lngInput?.value) {
        const position = {
          lat: parseFloat(latInput.value),
          lng: parseFloat(lngInput.value),
        };
        placeMarker(position);
        map.setCenter(position);
      } else {
        // ใช้ตำแหน่งผู้ใช้จริง
        getCurrentPosition()
          .then((pos) => {
            map.setCenter(pos);
            placeMarker(pos);
          })
          .catch(() => {
            console.warn("ใช้พิกัดเริ่มต้นแทนเพราะไม่ได้รับอนุญาตตำแหน่ง");
            placeMarker(defaultLocation);
          });
      }

      // เมื่อคลิกบนแผนที่ → ปักหมุดใหม่
      map.addListener("click", (event) => {
        const clickedPos = event.latLng.toJSON();
        placeMarker(clickedPos);
        updateInputs(clickedPos);
        reverseGeocode(clickedPos);
      });
    } catch (err) {
      console.error("Map initialization error:", err);
      alert("❌ โหลดแผนที่ไม่สำเร็จ กรุณารีเฟรชหน้าอีกครั้ง");
    }
  };

  /**
   * ✅ ปักหมุดบนแผนที่
   */
  function placeMarker(position) {
    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({
      position,
      map,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });

    marker.addListener("dragend", () => {
      const newPos = marker.getPosition().toJSON();
      updateInputs(newPos);
      reverseGeocode(newPos);
    });
  }

  /**
   * ✅ ดึงตำแหน่งปัจจุบันจาก Browser (Promise)
   */
  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("ไม่รองรับ geolocation");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => reject(err)
      );
    });
  }

  /**
   * ✅ อัปเดตค่า Latitude / Longitude ลงใน input
   */
  function updateInputs(pos) {
    const latInput = document.getElementById(LAT_ID);
    const lngInput = document.getElementById(LNG_ID);
    if (latInput && lngInput) {
      latInput.value = pos.lat.toFixed(6);
      lngInput.value = pos.lng.toFixed(6);
    }
  }

  /**
   * ✅ แปลงพิกัดเป็นชื่อที่อยู่ (Reverse Geocoding)
   */
  function reverseGeocode(pos) {
    if (!geocoder) return;

    geocoder.geocode({ location: pos }, (results, status) => {
      if (status === "OK" && results[0]) {
        const addressField = document.getElementById(ADDRESS_ID);
        if (addressField) {
          addressField.value = results[0].formatted_address;
        }
      } else {
        console.warn("ไม่สามารถแปลงพิกัดเป็นที่อยู่ได้:", status);
      }
    });
  }

  /**
   * ✅ ป้องกัน error เมื่อโหลด map.js แต่ยังไม่มี div#map
   */
  document.addEventListener("DOMContentLoaded", () => {
    const mapElement = document.getElementById(MAP_ID);
    if (!mapElement) return;
    if (typeof google === "undefined" || !google.maps) {
      console.warn("Google Maps ยังไม่ถูกโหลด");
    }
  });
})();
