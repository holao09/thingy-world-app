class Device {
  static fromJSON(deviceJSON) {
    return {
      id: deviceJSON.id || "",
      name: deviceJSON.name || "",
      connected: Device.getConnection(deviceJSON),
    };
  }

  static fromLocationJSON(locationDataJSON) {
    const deviceLat = +locationDataJSON.lat || undefined;
    const deviceLon = +locationDataJSON.lon || undefined;
    return {
      id: locationDataJSON.deviceId,
      coords: {
        lat: deviceLat,
        lng: deviceLon,
      },
      serviceType: locationDataJSON.serviceType || "GPS",
      uncertainty: +locationDataJSON.uncertainty || "N/A",
      position: deviceLat && deviceLon ? [deviceLat, deviceLon] : [],
      locationUpdate: locationDataJSON.insertedAt || "N/A",
    };
  }

  static fromDeviceLocationJSON(deviceJSON, locationDataJSON) {
    const deviceLat = +locationDataJSON.lat || undefined;
    const deviceLon = +locationDataJSON.lon || undefined;
    return {
      id: deviceJSON.id,
      name: deviceJSON.name,
      coords: {
        lat: deviceLat,
        lng: deviceLon,
      },
      connected: Device.getConnection(deviceJSON),
      properties: Device.getProperties(deviceJSON),
      serviceType: locationDataJSON.serviceType || "GPS",
      uncertainty: +locationDataJSON.uncertainty || "N/A",
      position: deviceLat && deviceLon ? [deviceLat, deviceLon] : [],
      locationUpdate: locationDataJSON.insertedAt || "N/A",
    };
  }

  static getConnection(deviceJSON) {
    if (deviceJSON && deviceJSON.state && deviceJSON.state.reported) {
      const isConnected_LEGACY_FIRMWARE = !!deviceJSON.state.reported.connected;
      const isConnected_UPDATED_FIRMWARE =
        deviceJSON.state.reported.connection &&
        deviceJSON.state.reported.connection.status === "connected";

      if (isConnected_LEGACY_FIRMWARE || isConnected_UPDATED_FIRMWARE) {
        return "connected";
      }
    }
    return "disconnected";
  }

  static getProperties(data) {
    // old firmware uses connected field
    // new firmware uses connection field with a status key value pair
    if (data && data.state && data.state.reported) {
      var isConnected_LEGACY_FIRMWARE = !!data.state.reported.connected;
      var isConnected_UPDATED_FIRMWARE =
        data.state.reported.connection &&
        data.state.reported.connection.status === "connected";

      if (isConnected_LEGACY_FIRMWARE || isConnected_UPDATED_FIRMWARE) {
        this.connected = "connected";
      }
    }

    return {
      name: this.name,
      connected: this.connected,
    };
  }
}
