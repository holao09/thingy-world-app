const handleEvent = (
  eventName,
  { el, callback, useCapture = false } = {},
  thisArg
) => {
  const element = el || document.documentElement;

  function handler(e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof callback === "function") {
      callback.call(thisArg, e);
    }
  }
  handler.destroy = function destroy() {
    return element.removeEventListener(eventName, handler, useCapture);
  };
  element.addEventListener(eventName, handler, useCapture);
  return handler;
};

const pollingTime = 5000;
let pollingTimer;

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded");

  const sidebar = new SidebarView();
  const globeView = new GlobeView();

  sidebar.addEventListener("onDeviceSelected", (e) => {
    clearTimeout(pollingTimer);

    const selectedDevice = e.id;
    sidebar.showLoading();
    Promise.all([
      fetchRawDevice(selectedDevice),
      fetchDeviceLastLocation(selectedDevice),
    ]).then((result) => {
      const [rawResult, lastLocationResult] = result;
      const {
        items: [rawDeviceJSON],
      } = rawResult;
      const {
        items: [deviceLocationJSON],
      } = lastLocationResult;

      if (deviceLocationJSON) {
        globeView.updateDeviceMarker(
          Device.fromDeviceLocationJSON(rawDeviceJSON, deviceLocationJSON)
        );
        sidebar.setDataInfo("Location", deviceLocationJSON);
      } else if (deviceLocationJSON === undefined) {
        fetchDeviceLastLocation_LEGACY(selectedDevice).then(
          (legacyLocationResult) => {
            sidebar.setDataInfo(
              "Location",
              parseLegacLocationHistory(legacyLocationResult)
            );
          }
        );
      }

      globeView.goToDevice(selectedDevice);
    });

    fetchMessagesForDevice(selectedDevice).then((deviceEnvData) => {
      sidebar.setDataInfo("Env", deviceEnvData);
    });
  });

  sidebar.addEventListener("onDeviceSelectedLongPress", (e) => {
    clearTimeout(pollingTimer);
    const update = (selectedDevice) => {
      clearTimeout(pollingTimer);
      pollingTimer = setTimeout(async () => {
        await Promise.all([
          fetchRawDevice(selectedDevice),
          fetchDeviceLastLocation(selectedDevice),
          fetchMessagesForDevice(selectedDevice),
        ]).then((result) => {
          const [rawResult, lastLocationResult, deviceEnvData] = result;
          const {
            items: [rawDeviceJSON],
          } = rawResult;
          const {
            items: [deviceLocationJSON],
          } = lastLocationResult;

          sidebar.setDataInfo("Env", deviceEnvData);

          if (deviceLocationJSON) {
            globeView.updateDeviceMarker(
              Device.fromDeviceLocationJSON(rawDeviceJSON, deviceLocationJSON)
            );
            sidebar.setDataInfo("Location", deviceLocationJSON);
          } else if (deviceLocationJSON === undefined) {
            fetchDeviceLastLocation_LEGACY(selectedDevice).then(
              (legacyLocationResult) => {
                sidebar.setDataInfo(
                  "Location",
                  parseLegacLocationHistory(legacyLocationResult)
                );
              }
            );
          }
          update(selectedDevice);
        });
      }, 5000);
    };
    update(e.id);
  });

  globeView.onload(() => {
    if (
      document.querySelector(".intro-container") &&
      !document
        .querySelector(".intro-container")
        .classList.contains("globe-rendered")
    ) {
      document
        .querySelector(".intro-container")
        .classList.add("globe-rendered");
      document.querySelector(".message").innerHTML = "Click Anywhere to Begin.";
    }
  });

  fetchDevices((deviceJSON, deviceLocationJSON) => {
    const device = Device.fromDeviceLocationJSON(
      deviceJSON,
      deviceLocationJSON
    );
    sidebar.addDeviceToListEntry(device);
    globeView.addDeviceMarker(device);
  });

  window.setTimeout(function () {
    document.querySelector("body").classList.add("loaded");
    if (window.innerWidth > 770) {
      document.querySelector(".sidebar").classList.add("open");
      document.querySelector("body").classList.add("open-sidebar");
    }
  }, 800);

  // hide, then remove the intro overlay
  document
    .querySelector(".intro-container")
    .addEventListener("click", function () {
      this.classList.add("hidden");
      window.setTimeout(function () {
        document.querySelector(".intro-container").remove();
      }, 800);
    });
});
