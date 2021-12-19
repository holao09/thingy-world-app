class GlobeView extends Cesium.Viewer {
  constructor(imagery = Cesium.createDefaultImageryProviderViewModels()) {
    super("cesiumContainer", {
      imageryProviderViewModels: imagery,
      selectedImageryProviderViewModel: imagery[1],
    });
    this.scene.screenSpaceCameraController.enableTilt = false;
  }

  onload = (callback) => {
    this.scene.postRender.addEventListener(callback);
  };

  addDeviceMarker(device) {
    const showEntity = device && device.position && device.position.length > 0;
    const position =
      showEntity == true
        ? Cesium.Cartesian3.fromDegrees(device.position[1], device.position[0])
        : null;

    this.entities.add({
      id: device.id,
      ...(position ? { position } : {}),
      properties: {
        ...device,
      },
      billboard: {
        height: 32,
        width: 32,
        image:
          device.connected === "connected"
            ? "img/nordic-icon-connected.svg"
            : "img/nordic-icon-g.svg",
        show: showEntity,
      },
    });
  }

  updateDeviceMarker(deviceFromLocationJSON) {
    const entity = this.entities.getById(deviceFromLocationJSON.id);

    if (entity === undefined) {
      return;
    }

    const showEntity =
      deviceFromLocationJSON &&
      deviceFromLocationJSON.position &&
      deviceFromLocationJSON.position.length > 0;
    const position =
      showEntity == true
        ? Cesium.Cartesian3.fromDegrees(
            deviceFromLocationJSON.position[1],
            deviceFromLocationJSON.position[0]
          )
        : null;

    entity.position.setValue = position;
    entity.properties.setValue = { ...deviceFromLocationJSON };
  }

  goToDevice(deviceId) {
    this.selectedEntity = this.entities.getById(deviceId);
    this.resetIcons();
    this.resetHPE();

    if (this.selectedEntity !== undefined) {
      this.selectedEntity.billboard = {
        height: 64,
        width: 64,
        image: "img/nordic-icon-y.svg",
      };
    }

    const deviceLon = this.selectedEntity.properties.coords.getValue().lng;
    const deviceLat = this.selectedEntity.properties.coords.getValue().lat;
    const uncertainty = this.selectedEntity.properties.uncertainty.getValue();
    const serviceType = this.selectedEntity.properties.serviceType.getValue();

    if (
      deviceLat &&
      deviceLon &&
      this.selectedEntity.properties &&
      this.selectedEntity.properties.coords
    ) {
      this.flyTo(this.selectedEntity, {
        offset: new Cesium.HeadingPitchRange(0, -90, 5000),
      });
    }

    // render uncertainty circle
    if (uncertainty && uncertainty !== "N/A") {
      let fillColor = Cesium.Color.PURPLE.withAlpha(0.2);

      if (serviceType === "SCELL") {
        fillColor = Cesium.Color.CORNFLOWERBLUE.withAlpha(0.2);
      } else if (serviceType === "MCELL") {
        fillColor = Cesium.Color.ORANGE.withAlpha(0.2);
      }

      this.entities.add({
        id: `${deviceId}-HPE`,
        position: Cesium.Cartesian3.fromDegrees(deviceLon, deviceLat),
        ellipse: {
          semiMinorAxis: uncertainty,
          semiMajorAxis: uncertainty,
          material: fillColor,
        },
      });
    }
  }

  resetIcons() {
    var entriesArray = this.entities.values;
    if (undefined !== this.selectedEntity) {
      for (let i = 0; i < entriesArray.length; i++) {
        if (
          entriesArray[i].billboard &&
          entriesArray[i].billboard.image &&
          entriesArray[i].billboard.image.getValue() !== undefined
        ) {
          entriesArray[i].billboard = {
            height: 32,
            width: 32,
            image:
              entriesArray[i].properties.connected.getValue() === "connected"
                ? "img/nordic-icon-connected.svg"
                : "img/nordic-icon-g.svg",
          };
        }
      }
    }
  }

  resetHPE() {
    var entriesArray = this.entities.values;
    if (undefined !== this.selectedEntity) {
      for (let i = 0; i < entriesArray.length; i++) {
        if (entriesArray[i].id.includes("HPE")) {
          this.entities.removeById(entriesArray[i].id);
        }
      }
    }
  }
}
