class SidebarView extends EventTarget {
  constructor() {
    super();
    this.isOpen = true;
    this.DOM = {};
    this.DOM.body = document.querySelector("body");
    this.DOM.sidebar = document.querySelector(".sidebar");
    this.DOM.toggle = document.querySelector(".sidebar-toggle");
    this.DOM.sidebarHeading = document.querySelector(
      ".device-list-block .sidebar-heading"
    );
    this.DOM.data = this.DOM.sidebar.querySelector(".sidebar-data");
    this.DOM.deviceInfo = this.DOM.sidebar.querySelector(".device-info");
    this.DOM.locationName = this.DOM.deviceInfo.querySelector(
      ".device-location-name"
    );
    this.DOM.coordinates = this.DOM.deviceInfo.querySelector(
      ".device-location-coords .coordinates"
    );
    this.DOM.deviceData = this.DOM.deviceInfo.querySelector(".device-data");
    this.DOM.deviceList = this.DOM.sidebar.querySelector(".device-list");
    this.init();
  }

  addDeviceToListEntry(device) {
    const listEntry = document.createElement("li");

    const deviceAnchor = document.createElement("a");
    deviceAnchor.href = "#";
    deviceAnchor.className = device.connected;
    deviceAnchor.id = device.id;
    deviceAnchor.innerText = device.name;
    deviceAnchor.onclick = (e) => {
      const event = new CustomEvent("onDeviceSelected");
      event.id = e.currentTarget.id;
      this.dispatchEvent(event);
      for (let i = 0; i < this.DOM.deviceList.children.length; i++) {
        this.DOM.deviceList.children[i].classList.remove("active");
      }
      listEntry.className = "active";
    };

    listEntry.appendChild(deviceAnchor);
    this.DOM.deviceList.appendChild(listEntry);
    this.DOM.sidebarHeading.innerText = `All Devices (${this.DOM.deviceList.childElementCount})`;
  }

  showLoading(locationData = true, environmentalData = true) {
    if (locationData) {
      $(".device-data__datum.location_method .datum-info").html("Loading...");
      $(".device-data__datum.uncertainty .datum-info").html("Loading...");
      $(".device-data__datum").show();
    }

    if (environmentalData) {
      $(".device-data__datum.temp .datum-info").html("Loading...");
      $(".device-data__datum.humidity .datum-info").html("Loading...");
      $(".device-data__datum").show();
    }
  }

  setDataInfo(infoBox, message) {
    if (infoBox === "Env") {
      $(".device-data__datum.temp .datum-info").html(
        this.formatDataString(message, "Temperature")
      );
      $(".device-data__datum.temp .datum-timestamp").html(
        this.formatTimestamp(message, "Temperature")
      );

      $(".device-data__datum.humidity .datum-info").html(
        this.formatDataString(message, "Humidity")
      );
      $(".device-data__datum.humidity .datum-timestamp").html(
        this.formatTimestamp(message, "Humidity")
      );
    }

    if (infoBox === "Location") {
      const { lat, lon, serviceType, uncertainty, insertedAt } = message || {};

      const updatedTime = moment(new Date(insertedAt)).format(
        "ddd MMM DD YYYY, kk:mm:ss"
      );

      $(".device-data__datum.location_method .datum-info").html(
        serviceType || "GPS"
      );
      $(".device-data__datum.location_method .datum-timestamp").html(
        updatedTime != "Invalid date" ? `updated ${updatedTime}` : "No update"
      );
      $(".device-data__datum.uncertainty .datum-info").html(
        this.formatUncertainty(uncertainty)
      );
      $(".device-data__datum.uncertainty .datum-timestamp").html(
        uncertainty ? `updated ${updatedTime}` : "No update"
      );
      console.log("This is message", message);
      this.DOM.coordinates.innerHTML =
        lat && lon
          ? `${(+lat).toFixed(4)}, ${(+lon).toFixed(4)}`
          : "No Location Data Available";
    }
  }

  formatDataString(message, dataKey) {
    const isFormatable =
      !isNaN(message[dataKey].data) && message[dataKey].data !== null;
    const dataType = dataKey === "Temperature" ? "C°" : "%";
    return isFormatable
      ? `${Number.parseFloat(message[dataKey].data).toFixed(2)}${dataType}`
      : "--";
  }

  formatTimestamp(message, dataKey) {
    if (message[dataKey].timestamp === null) {
      return "No Update";
    }

    const formatedTime = moment(
      new Date(Date.parse(message[dataKey].timestamp))
    ).format("ddd MMM DD YYYY, kk:mm:ss");

    return `updated ${formatedTime}`;
  }

  formatUncertainty(uncertainty) {
    return uncertainty && (uncertainty === "NA" || uncertainty === "N/A")
      ? "N/A"
      : `${uncertainty} m`;
  }

  init() {
    console.log("init");
    this.isOpenTest();
    this.clickEvents();
  }

  openSidebar() {
    this.DOM.sidebar.classList.add("open");
    this.DOM.body.classList.add("open-sidebar");
  }
  closeSidebar() {
    this.DOM.sidebar.classList.remove("open");
    this.DOM.body.classList.remove("open-sidebar");
  }
  closeMobileSidebar() {
    document.querySelector(".mobile-sidebar").classList.remove("reveal");
  }

  isOpenTest() {
    this.isOpen = this.DOM.sidebar.classList.contains("open") ? true : false;
  }

  toggleOpen() {
    this.isOpenTest();
    if (this.isOpen == true) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  clickEvents() {
    //toggle sidebar 'open'
    handleEvent("click", {
      el: this.DOM.toggle,
      callback: () => {
        this.toggleOpen();
      },
    });

    var devices = this.DOM.deviceList.querySelectorAll("li");
    for (let i = 0; i < devices.length; i++) {
      let el = devices[i];
      handleEvent("click", {
        el: el,
        callback: () => {
          console.log(el);
        },
      });
    }
  }
}
