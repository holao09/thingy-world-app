function getAjaxSettings(url, async = true) {
  var settings = {
    crossDomain: true,
    async: async,
    url: url,
    method: "GET",
    headers: {
      Authorization: "Bearer 12af85ea3af2d76df38e56a9bc1484fd70389d1d", // viewer access token
    },
  };
  return settings;
}

function fetchRawDevices() {
  return $.ajax(
    getAjaxSettings(
      "https://api.nrfcloud.com/v1/devices?includeState=true&includeStateMeta=true&pageSort=desc&pageLimit=100",
      false
    )
  );
}

function fetchRawDevice(deviceId) {
  return $.ajax(
    getAjaxSettings(
      `https://api.nrfcloud.com/v1/devices?deviceId=${deviceId}includeState=true&includeStateMeta=true&pageLimit=1`
    )
  );
}

function fetchDeviceLastLocation(deviceId) {
  return $.ajax(
    getAjaxSettings(
      `https://api.nrfcloud.com/v1/location/history?deviceId=${deviceId}&pageLimit=1`
    )
  );
}

function fetchDeviceLastLocation_LEGACY(deviceId) {
  return $.ajax(
    getAjaxSettings(
      `https://api.nrfcloud.com/v1/messages?deviceId=${deviceId}&pageLimit=1&pageSort=desc&appId=GPS`
    )
  );
}

function fetchDeviceLocation(deviceId) {
  return Promise.all([
    fetchDeviceLastLocation(deviceId),
    fetchDeviceLastLocation_LEGACY(deviceId),
  ]);
}

function fetchDevices(callback) {
  fetchRawDevices().done(function (response) {
    const devices = response.items;
    for (let i = 0; i < devices.length; i++) {
      const deviceId = devices[i].id;
      $.ajax({
        ...getAjaxSettings(
          "https://api.nrfcloud.com/v1/location/history?deviceId=" +
            deviceId +
            "&pageLimit=1"
        ),
        dataType: "json",
        success: function (result) {
          const locationResult = result && result.items[0];
          if (locationResult === undefined) {
            $.ajax({
              ...getAjaxSettings(
                "https://api.nrfcloud.com/v1/messages?deviceId=" +
                  deviceId +
                  "&pageLimit=1&pageSort=desc&appId=GPS"
              ),
              success: function (legacyLocationHistoryResponse) {
                callback(devices[i], {
                  deviceId,
                  ...parseLegacLocationHistory(legacyLocationHistoryResponse),
                });
              },
            });
          } else {
            callback(devices[i], locationResult);
          }
        },
      });
    }
  });
}

function fetchMessagesForDevice(deviceId, callback) {
  return Promise.all([
    $.ajax(
      getAjaxSettings(
        `https://api.nrfcloud.com/v1/messages?deviceId=${deviceId}&pageLimit=1&pageSort=desc&appId=TEMP`
      )
    ),
    $.ajax(
      getAjaxSettings(
        `https://api.nrfcloud.com/v1/messages?deviceId=${deviceId}&pageLimit=1&pageSort=desc&appId=HUMID`
      )
    ),
  ]).then((result) => {
    const tempData = result[0].items && result[0].items[0];
    const humidData = result[1].items && result[1].items[0];
    callback({
      Temperature: {
        data: tempData.message.data,
        timestamp: tempData.receivedAt,
      },
      Humidity: {
        data: humidData.message.data,
        timestamp: humidData.receivedAt,
      },
    });
  });
}

function parseLegacLocationHistory(legacyLocationHistoryResponse) {
  const legacyDeviceLocationHistoryResult =
    legacyLocationHistoryResponse &&
    legacyLocationHistoryResponse.items &&
    legacyLocationHistoryResponse.items[0] &&
    legacyLocationHistoryResponse.items[0].message &&
    legacyLocationHistoryResponse.items[0].message.data;

  if (legacyDeviceLocationHistoryResult === undefined) {
    return;
  }

  var gpsArray = legacyDeviceLocationHistoryResult.split(",");
  // process latitude
  var lat_degrees =
    parseFloat(gpsArray[2].substr(gpsArray[2].indexOf(".") - 2)) / 60 +
    parseFloat(gpsArray[2].substr(0, gpsArray[2].indexOf(".") - 2));
  var lat_multiplier = gpsArray[3] == "N" ? 1 : -1;
  var lat = lat_degrees * lat_multiplier;
  var lng_degrees =
    parseFloat(gpsArray[4].substr(gpsArray[4].indexOf(".") - 2)) / 60 +
    parseFloat(gpsArray[4].substr(0, gpsArray[4].indexOf(".") - 2));
  var lng_multiplier = gpsArray[5] == "E" ? 1 : -1;

  var lng = lng_degrees * lng_multiplier;

  return {
    lon: lng,
    lat,
    uncertainty: "N/A",
    serviceType: "GPS",
    insertedAt: legacyLocationHistoryResponse.items[0].receivedAt,
  };
}
