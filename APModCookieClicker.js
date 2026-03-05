// ==UserScript==
// @name         AP_CookieClicker
// @namespace    http://tampermonkey.net/
// @version      2026-02-22
// @description  Archipelago
// @author       SX
// @match        https://orteil.dashnet.org/cookieclicker/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dashnet.org
// @require
// @grant        none
// @top-level-await
// ==/UserScript==

const {Client, itemsHandlingFlags} = await import(
  // Switched to a fork because main repo has a bug on hint ordering
  "https://unpkg.com/@airbreather/archipelago.js@2.0.5-airbreather"
  );
//'use strict';

// TODO
// Error Handling on Connection
// Logic for Achievements
// Configs for Shimmer and Sugar Lump Times

console.log("AP CookieClicker loaded");

//this started as Cookieclicker, but should work as a template for all browser games
//therefore code is splitted into Archipelago stuff, and Game specific Stuff
//so you just need to change Game Specific stuff

//ToastLibary, for Announcements

const cssToast = document.createElement("link");
cssToast.href = "https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css";
cssToast.type = "text/css";
cssToast.rel = "stylesheet";
document.head.append(cssToast);

const scriptToast = document.createElement("script");
scriptToast.src = "https://cdn.jsdelivr.net/npm/toastify-js";
scriptToast.type = "text/javascript";
document.head.append(scriptToast);

/* Usage
    Toastify({
        text: "This is a toast",
        duration: 3000
    }).showToast();
*/

// Input fields
const connectionContainer = document.createElement("div");
const hostname = document.createElement("input");
const port = document.createElement("input");
const name = document.createElement("input");
const password = document.createElement("input");
const connect = document.createElement("button");
const consoleInput = document.createElement("input");
consoleInput.disabled = true;
connect.onclick = function () {
  connectAP();
};
const text = document.createElement("span");

connectionContainer.style.display = "flex";
connectionContainer.style.margin = "0";
connectionContainer.style.padding = "0";
connectionContainer.style.position = "absolute";
connectionContainer.style.top = "8.5rem";
connectionContainer.style.right = "0";
connectionContainer.style.left = "0";
connectionContainer.style.zIndex = "99999";
connectionContainer.style.justifyContent = "center";
connectionContainer.style.gap = "1rem";
connectionContainer.append(
  text,
  hostname,
  port,
  name,
  password,
  connect,
  consoleInput,
);

text.innerText = "AP Conn: ";
hostname.placeholder = "Address";
hostname.style.width = "120px";
port.placeholder = "Port";
port.style.width = "64px";
name.placeholder = "Slot Name";
name.style.width = "120px";
password.placeholder = "Password";
password.type = "password";
password.style.width = "100px";
connect.innerText = "Connect";
consoleInput.placeholder = "!hint";

// Console
consoleInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    window.client.messages.say(consoleInput.value);
    consoleInput.value = "";
  }
});

document.body.prepend(connectionContainer);

const style = document.createElement("style");
style.textContent = ".hinted { opacity: 1 !important }";
document.head.append(style);

function typeToText(element) {
  let id = -1;
  id = Number(element.text);

  if (element.type === "player_id" && !isNaN(id)) {
    return window.client.players.findPlayer(parseInt(element.text, 10))?.alias;
  } else if (element.type === "item_id" && !isNaN(id)) {
    return window.client.package.lookupItemName(
      window.client.players.findPlayer(element.player)?.game ?? "",
      parseInt(element.text, 10),
    );
  } else if (element.type === "location_id" && !isNaN(id)) {
    return window.client.package.lookupLocationName(
      window.client.players.findPlayer(element.player)?.game ?? "",
      parseInt(element.text, 10),
    );
  } else if (element.text !== undefined) {
    return element.text;
  } else {
    return element;
  }
}

function packetToText(packet) {
  if (packet === undefined) {
    return "";
  }
  let msg = "";
  packet.forEach((element) => {
    msg += typeToText(element) + " ";
  });
  return msg;
}

function getPlayerId(map, searchValue) {
  for (let [key, value] of map.entries()) {
    if (value.name === searchValue) return key;
  }
}

function sendCheckIdToAp(id) {
  window.client.check(id);
  // Essential to avoid discrepancies between AP server state and CC local save
  // We could do a full check after each game load to sync both, with forced Game.Win/Game.RemoveAchiev
  Game.WriteSave();
}

function releaseAll() {
  window.client.check(window.client.room.allLocations);
}

function connectAP() {
  window.client = new Client();
  connect.disabled = true;
  hostname.disabled = true;
  port.disabled = true;
  name.disabled = true;
  password.disabled = true;
  consoleInput.disabled = false;

  if (parseInt(port.value) !== parseInt(localStorage.getItem("port"))) {
    if (
      confirm(
        "Your Port changed, so this might be a new Game. DELETE LOCAL SAVE GAME?",
      ) == true
    ) {
      Game.HardReset(2);
      receivedItems = [];
    }
  }

  let self = this;
  const connectionInfo = {
    password: password.value,
    items_handling: itemsHandlingFlags.all,
  };
  const url = hostname.value + ":" + port.value;

  // If connected
  window.client.socket.disconnect();

  // Set up event listeners
  window.client.socket.on("connected", async (packet) => {
    console.log("Connected to server: ", packet);
    await appendFunctions();
    save();
  });

  window.client.socket.on("roomUpdate", (packet) => {
    console.log("Room update: ", packet);
  });

  window.client.socket.on("receivedItems", (packet) => {
    console.log("Received Items: ", packet);

    // When items.length > 1 its an reconnect
    if (packet.items.length > 1) {
      const serverItems = [];

      // Execute Items with firstTime = false > only Unlocks, no Traps or Items
      packet.items.forEach((item) => {
        receiveItem(item.item, false);
        serverItems.push(item.item);
      });

      // Compare serverItems with local saved (and executed Items)
      const difference = serverItems.filter((x) => !receivedItems.includes(x));
      console.log("serverItems");
      console.log(serverItems);

      console.log("receivedItems");
      console.log(receivedItems);

      console.log("difference");
      console.log(difference);

      difference.forEach((id) => {
        receiveItem(id, true);
      });
    } else {
      // Just one Item means its new > always use
      receiveItem(packet.items[0].item, true);
    }
  });

  window.client.socket.on("locationInfo", (packet) => {
    console.log("Hint: ", packet);
    //self.hints.concat(packet.items);
  });

  window.client.socket.on("printJSON", (packet) => {
    console.debug("Print JSON: ", packet);
    let msg = packetToText(packet.data);
    if (msg === "") {
      return;
    }
    console.log("MSG: " + msg);
    toast(msg);
  });

  // Connect to the Archipelago server
  window.client
    .login(url, name.value, gameName, connectionInfo)
    .then(() => {
      console.log("Connected to the server");
    })
    .catch((error) => {
      console.error("Failed to connect:", error.toString());
      toast(error.toString());
      connect.disabled = true;
      hostname.disabled = true;
      port.disabled = true;
      name.disabled = true;
      password.disabled = true;
      consoleInput.disabled = false;
    });

  // Disconnect from the server when unloading window
  window.addEventListener("beforeunload", () => {
    window.client.socket.disconnect();
  });
}

//forDev
hostname.value = "archipelago.gg";
//port.value = "51981";
//name.value = "Alex_CC";

/*                                   */
/*                                   */
/* GAME SPECIFIC FUNCTIONS DOWN HERE */
/*                                   */
/*                                   */

const gameName = "Cookie Clicker";
let goalAchievementCount = 1000; // Default value prevent accidental goaling
let receivedItems = [];
let locationsByDisplayOrder = [];
// Fields should be the same as Options.py
const gameOptions = {
  advancement_goal: null,
  traps_percentage: null,
  enable_hints: null,
};

/* On Site Loaded */
// Disable CookieClicker
document.getElementById("wrapper").style.visibility = "hidden";

function save() {
  localStorage.setItem("receivedItems", JSON.stringify(receivedItems));
  localStorage.setItem("host", hostname.value);
  localStorage.setItem("port", port.value);
  if (port.value === "") localStorage.setItem("port", "38281"); //Handle blank port -> default port
  localStorage.setItem("name", name.value);
  localStorage.setItem("password", password.value);
}

function load() {
  receivedItems = JSON.parse(localStorage.getItem("receivedItems")) || [];

  let urlParams = new URLSearchParams(window.location.search);
  hostname.value =
    urlParams.get("host") ||
    urlParams.get("Host") ||
    localStorage.getItem("host") ||
    hostname.value ||
    "archipelago.gg";
  port.value =
    urlParams.get("port") ||
    urlParams.get("Port") ||
    localStorage.getItem("port") ||
    port.value ||
    "";
  name.value =
    urlParams.get("name") ||
    urlParams.get("Name") ||
    localStorage.getItem("name") ||
    name.value ||
    "";
  password.value =
    urlParams.get("password") ||
    urlParams.get("Password") ||
    localStorage.getItem("password") ||
    password.value ||
    "";
}

load();

function randomProperty(obj) {
  let keys = Object.keys(obj);
  return obj[keys[(keys.length * Math.random()) << 0]];
}

// For this game we use the Games Chat, not the default Toast
function toast(message) {
  Game.Notify("Archipelago", message);
  /*
    Toastify({
        text: message,
        duration: 5000
    }).showToast();
    */
}

const OFFSET = {
  ITEMS: {
    BUILDINGS: 10000000,
    UPGRADES: 20000000,
    FILLERS: 50000000,
    TRAPS: 60000000
  },
  ACHIEVEMENTS: 42069001
}

function receiveItem(itemId, firstTime) {
  let building = randomProperty(Game.Objects); // FIXME should exclude locked buildings

  if (firstTime) {
    receivedItems.push(itemId);
    console.log(`I apply a new item! ${itemId}`);
  }

  save();

  const range = Math.floor(itemId / 10000000) * 10000000

  if (range === OFFSET.ITEMS.FILLERS && firstTime) {
    switch (itemId) {
      case OFFSET.ITEMS.FILLERS + 0 :
        Game.cookies *= 2;
        console.log("*2 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 1 :
        Game.cookies *= 999;
        console.log("*999 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 2 :
        Game.cookies *= 9999;
        console.log("*9999 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 3 :
        Game.cookies *= 9999999;
        console.log("*9999999 Cookies");
        break;
      case OFFSET.ITEMS.FILLERS + 4 :
        Game.cookies *= 0.5;
        console.log("*0.5 Cookies");
        break;
    }
  }
  if (range === OFFSET.ITEMS.BUILDINGS) {
    switch (itemId) {
      case OFFSET.ITEMS.BUILDINGS + 0 : // Unlock Cursor
        document.getElementById("product0").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 1 : // Unlock Grandma
        document.getElementById("product1").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 2 : // Unlock Farm
        document.getElementById("product2").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 3 : // Unlock Mine
        document.getElementById("product3").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 4 : // Unlock Factory
        document.getElementById("product4").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 5 : // Unlock Bank
        document.getElementById("product5").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 6 : // Unlock Temple
        document.getElementById("product6").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 7 : // Unlock Wizard Tower
        document.getElementById("product7").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 8 : // Unlock Shipment
        document.getElementById("product8").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 9 : // Unlock Alchemy Lab
        document.getElementById("product9").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 10 : // Unlock Portal
        document.getElementById("product10").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 11 : // Unlock Time Machine
        document.getElementById("product11").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 12 : // Unlock Antimatter Condenser
        document.getElementById("product12").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 13 : // Unlock Prism
        document.getElementById("product13").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 14 : // Unlock Chancemaker
        document.getElementById("product14").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 15 : // Unlock Fractal Engine
        document.getElementById("product15").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 16 : // Unlock Javascript Console
        document.getElementById("product16").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 17 : // Unlock Idleverse
        document.getElementById("product17").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 18 : // Unlock Cortex Baker
        document.getElementById("product18").style.display = "";
        break;
      case OFFSET.ITEMS.BUILDINGS + 19 : // Unlock You
        document.getElementById("product19").style.display = "";
        break;
    }
  }
  if (range === OFFSET.ITEMS.UPGRADES) {
    const upgradeId = itemId - OFFSET.ITEMS.UPGRADES - 1;
    Game.UpgradesById[upgradeId].basePrice = -1;
    let success = Game.UpgradesById[upgradeId].buy();
    if (success !== 1) {
      // If there is no buy function, set it to bought manually
      Game.UpgradesById[upgradeId].bought = 1;
    }
  }
  if (range === OFFSET.ITEMS.TRAPS && firstTime) {
    switch (itemId) {
      case OFFSET.ITEMS.TRAPS + 0 :
        building.amount = Math.max(building.amount - 1, 0);
        Game.Notify("Archipelago", "-1 " + building.name);
        console.log("-1 Building");
        break;
      case OFFSET.ITEMS.TRAPS + 1 :
        building.amount = Math.max(building.amount - 10, 0);
        Game.Notify("Archipelago", "-10 " + building.name);
        console.log("-10 Building");
        break;
      case OFFSET.ITEMS.TRAPS + 2 :
        building.amount = Math.max(building.amount - 100, 0);
        Game.Notify("Archipelago", "-100 " + building.name);
        console.log("-100 Building");
        break;
      case OFFSET.ITEMS.TRAPS + 3 :
        Game.cookies *= 0.9;
        console.log("-10% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 4 :
        Game.cookies *= 0.8;
        console.log("-20% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 5 :
        Game.cookies *= 0.7;
        console.log("-30% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 6 :
        Game.cookies *= 0.6;
        console.log("-40% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 7 :
        Game.cookies *= 0.5;
        console.log("-50% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 8 :
        Game.cookies *= 0.4;
        console.log("-60% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 9 :
        Game.cookies *= 0.3;
        console.log("-70% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 10 :
        Game.cookies *= 0.2;
        console.log("-80% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 11 :
        Game.cookies *= 0.1;
        console.log("-90% Cookies");
        break;
      case OFFSET.ITEMS.TRAPS + 12 :
        Game.cookies = 0;
        console.log("-100% Cookies");
        break;
    }
  }
}

function loadAchieveNum() {
  // Game.AchievementsOwned does not include shadow achievements
  return Object.values(Game.Achievements).filter(achv => achv.won).length;
}

function debounceAndMergeInputs(func, delay) {
    let timeout;
    let allArgs = []
    return function (...args) {
        allArgs.push(...args);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, allArgs);
            allArgs = [];
        }, delay);
    };
}

/*
 When buying buildings by 100, many consecutive achievements are unlocked at once
 To prevent hinting locations that are unlocked right after, we apply a debounce and batch the request
*/
const scoutLocations = debounceAndMergeInputs((...locations) => {
  console.log("Scouting locations ", locations);
  window.client.scout(locations.map(me => me.id + OFFSET.ACHIEVEMENTS), 2)
}, 500)
// Reveal item locked behind adjacent achievements when completing one
function hintAdjacentLocations(it) {
  const aaa = locationsByDisplayOrder.findIndex(loc => loc.name === it.name)
  const prev = locationsByDisplayOrder[aaa - 1]
  const next = locationsByDisplayOrder[aaa + 1]
  if (!!prev && !prev.won) { scoutLocations(prev) }
  if (!!next && !next.won) { scoutLocations(next) }
}

// Append functions which need to be set or overwritten after Connection during Runtime
async function appendFunctions() {
  //enable CookieClicker
  document.getElementById("wrapper").style.visibility = "visible";

  //disable Buying of Upgrades
  //FIXME : some upgrades are not in the item pool and player should be able to buy them
  //document.getElementById("upgrades").style.pointerEvents = "none";

  //lock all Stores
  document.getElementById("product0").style.display = "none";
  //document.getElementById("product1").style.display = "none"; Grandmas are enabled from start
  document.getElementById("product2").style.display = "none";
  document.getElementById("product3").style.display = "none";
  document.getElementById("product4").style.display = "none";
  document.getElementById("product5").style.display = "none";
  document.getElementById("product6").style.display = "none";
  document.getElementById("product7").style.display = "none";
  document.getElementById("product8").style.display = "none";
  document.getElementById("product9").style.display = "none";
  document.getElementById("product10").style.display = "none";
  document.getElementById("product11").style.display = "none";
  document.getElementById("product12").style.display = "none";
  document.getElementById("product13").style.display = "none";
  document.getElementById("product14").style.display = "none";
  document.getElementById("product15").style.display = "none";
  document.getElementById("product16").style.display = "none";
  document.getElementById("product17").style.display = "none";
  document.getElementById("product18").style.display = "none";
  document.getElementById("product19").style.display = "none";

  // Read all game options
  await window.client.players.self.fetchSlotData().then((slotData) => {
    // Set advancement_goal as goalAchievementCount
    goalAchievementCount = slotData.advancement_goal;
    Object.keys(gameOptions).forEach(optionName => gameOptions[optionName] = slotData[optionName]);
    console.log("Game options:", gameOptions);
  });

  // Build a list of achievements ordered by their order field (ie. their display order)
  for (let i in Game.Achievements)//sort the achievements
  {
    locationsByDisplayOrder.push(Game.Achievements[i]);
  }
  let sortMap = function (a, b) {
    if (a.order > b.order) return 1;
    else if (a.order < b.order) return -1;
    else return 0;
  }
  locationsByDisplayOrder.sort(sortMap);

  if (gameOptions.enable_hints) {
    // Overwrite menu drawing so hinted locations are emphasized
    const CCUpdateMenu = Game.UpdateMenu;
    Game.UpdateMenu = (me, context) => {
      CCUpdateMenu(me, context);
      const menu = document.getElementById("menu");
      let menuItems = new Map(Object.values(menu.querySelectorAll(".achievement:not(.enabled)")).map(i => [i.dataset.id, i]))
      const hints = window.client.items.hints.filter(o => !o.found && o.item.locationGame === gameName)
      hints.forEach(h => {
        menuItems.get(String(h.item.locationId - OFFSET.ACHIEVEMENTS))?.classList.add("hinted")
      })
    }

    // Display hinted item name in the tooltip
    const mysterious = "???"
    const CCcrateTooltip = Game.crateTooltip;
    Game.crateTooltip = (me, context) => {
      let str = CCcrateTooltip(me, context);
      if (me.type === "achievement") {
        let h = window.client.items.hints.find(o => !o.found && o.item.locationId === me.id + OFFSET.ACHIEVEMENTS);
        if (!!h) {
          str = str
            .replace(mysterious, `${h.item.locationName}`)
            .replace(mysterious, `Will send item <b>${h.item.name}</b> to <b>${h.item.receiver.name}</b><br>---<br><b>Condition: </b>${me.desc}`)
        }
      }
      return str
    }
  }


  // Overwrite for win function CookieClicker
  Game.Win = function (what) {
    if (typeof what === "string") {
      if (Game.Achievements[what]) {
        let it = Game.Achievements[what];
        if (it.won == 0) {
          let name = it.shortName ? it.shortName : it.dname;
          it.won = 1;
          Game.Notify(
            loc("Achievement unlocked"),
            '<div class="title" style="font-size:18px;margin-top:-2px;">' +
            name +
            "</div>",
            it.icon,
          );
          Game.NotifyTooltip(
            "function(){return Game.crateTooltip(Game.AchievementsById[" +
            it.id +
            "]);}",
          );
          if (Game.CountsAsAchievementOwned(it.pool)) Game.AchievementsOwned++;
          Game.recalculateGains = 1;
          if (App && it.vanilla) App.gotAchiev(it.id);

          // Send AchievementID to AP
          sendCheckIdToAp(it.id + OFFSET.ACHIEVEMENTS);
          if (gameOptions.enable_hints) hintAdjacentLocations(it);

          const gameWon = window.client.items.received.some(i => i.id === 42000000)
          if (!gameWon && loadAchieveNum() >= goalAchievementCount) {
            console.log("Win-condition met!");
            sendCheckIdToAp(42000000)
            window.client.goal();
          }
        }
      }
    } else {
      for (let i in what) {
        Game.Win(what[i]);
      }
    }
  };

  // Overwrite Cookies
  //10x Shimmers
  let shimmersFactor = 10;

  Game.updateShimmers = function () {
    // Run shimmer functions, kill overtimed shimmers and spawn new ones
    for (var i in Game.shimmers) {
      Game.shimmers[i].update();
    }

    // Cookie storm!
    if (Game.hasBuff("Cookie storm") && Math.random() < 0.5) {
      var newShimmer = new Game.shimmer(
        "golden",
        {type: "cookie storm drop"},
        1,
      );
      newShimmer.dur = Math.ceil(Math.random() * 4 + 1);
      newShimmer.life = Math.ceil(Game.fps * newShimmer.dur);
      //newShimmer.force='cookie storm drop';
      newShimmer.sizeMult = Math.random() * 0.75 + 0.25;
    }

    // Spawn shimmers
    for (var i in Game.shimmerTypes) {
      let me = Game.shimmerTypes[i];
      if (me.spawnsOnTimer && me.spawnConditions()) {
        // Only run on shimmer types that work on a timer
        if (!me.spawned) {
          // No shimmer spawned for this type? Check the timer and try to spawn one
          //me.time++;
          me.time = me.time + shimmersFactor;
          if (
            Math.random() <
            Math.pow(
              Math.max(0, (me.time - me.minTime) / (me.maxTime - me.minTime)),
              5,
            )
          ) {
            var newShimmer = new Game.shimmer(i);
            newShimmer.spawnLead = 1;
            if (
              Game.Has("Distilled essence of redoubled luck") &&
              Math.random() < 0.01
            )
              var newShimmer = new Game.shimmer(i);
            me.spawned = 1;
          }
        }
      }
    }
  };

  Game.Reincarnate = function (bypass) {
    if (!bypass)
      Game.Prompt(
        "<id Reincarnate><h3>" +
        loc("Reincarnate") +
        '</h3><div class="block">' +
        loc("Are you ready to return to the mortal world?") +
        "</div>",
        [[loc("Yes"), "Game.ClosePrompt();Game.Reincarnate(1);"], loc("No")],
      );
    else {
      Game.ascendUpgradesl.innerHTML = "";
      Game.ascensionMode = Game.nextAscensionMode;
      Game.nextAscensionMode = 0;
      Game.Reset();
      if (Game.HasAchiev("Rebirth")) {
        Game.Notify("Reincarnated", loc("Hello, cookies!"), [10, 0], 4);
      }
      if (Game.resets >= 1000) Game.Win("Endless cycle");
      if (Game.resets >= 100) Game.Win("Reincarnation");
      if (Game.resets >= 10) Game.Win("Resurrection");
      if (Game.resets >= 1) Game.Win("Rebirth");

      let prestigeUpgradesOwned = 0;
      for (let i in Game.Upgrades) {
        if (Game.Upgrades[i].bought && Game.Upgrades[i].pool == "prestige")
          prestigeUpgradesOwned++;
      }
      if (prestigeUpgradesOwned >= 100) Game.Win("All the stars in heaven");

      Game.removeClass("ascending");
      Game.OnAscend = 0;

      // Trigger the reincarnate animation
      Game.ReincarnateTimer = 1;
      Game.addClass("reincarnating");
      Game.BigCookieSize = 0;

      Game.runModHook("reincarnate");

      // Reapply all items
      receivedItems.forEach((id) => {
        receiveItem(id, false);
      });
    }
  };

  // TODO Use Config?
  Game.computeLumpTimes = function () {
    let hour = 1000 * 6;
    Game.lumpMatureAge = hour * 20;
    Game.lumpRipeAge = hour * 23;
    if (Game.Has("Stevia Caelestis")) Game.lumpRipeAge -= hour;
    if (Game.Has("Diabetica Daemonicus")) Game.lumpMatureAge -= hour;
    if (Game.Has("Ichor syrup")) Game.lumpMatureAge -= 1000 * 60 * 7;
    if (Game.Has("Sugar aging process"))
      // In vanilla, 600 grandmas ~= 4% timer reduction
      Game.lumpRipeAge -= 6000 * Math.min(600, Game.Objects["Grandma"].amount); // Capped at 600 grandmas
    if (Game.hasGod && Game.BuildingsOwned % 10 == 0) {
      let godLvl = Game.hasGod("order");
      if (godLvl == 1) Game.lumpRipeAge -= hour;
      else if (godLvl == 2) Game.lumpRipeAge -= (hour / 3) * 2;
      else if (godLvl == 3) Game.lumpRipeAge -= hour / 3;
    }
    //if (Game.hasAura('Dragon\'s Curve')) {Game.lumpMatureAge/=1.05;Game.lumpRipeAge/=1.05;}
    Game.lumpMatureAge /= 1 + Game.auraMult("Dragon's Curve") * 0.05;
    Game.lumpRipeAge /= 1 + Game.auraMult("Dragon's Curve") * 0.05;
    Game.lumpOverripeAge = Game.lumpRipeAge + hour;
    // Note : Applying every single buffs is equivalent to ~20% timer reduction

    // Debug upgrade
    if (Game.Has("Glucose-charged air")) {
      Game.lumpMatureAge /= 2000;
      Game.lumpRipeAge /= 2000;
      Game.lumpOverripeAge /= 2000;
    }
  };
}