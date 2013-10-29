/*
 * Copyright (C) 2011 McGill University
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// Make sure basic ui stuff is done immediately.
$(function() {
  "use strict";
  
  var controls = $("#controls");

  $(".button").button();
  $(".buttonset").buttonset();
  $("#data-range-box").hide();
  
  $("#control-button").click(function() {
    var button_text = $(this).find("span");
    if (controls.is(":visible")) {
      controls.animate({height: 30}, 300).animate({width: 0}, 200, function() { controls.hide(); });
      button_text.text("Show Controls");
    } else {
      controls.show().animate({width: 450}, 200).animate({height: "70%"}, 300);
      button_text.text("Hide Controls");
    }
  });
  setTimeout(function() {
    $("#app-name").show("blind", {direction: "right"}, 500);
    $("#control-button").click();
  }, 0);
});

