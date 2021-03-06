/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Paul Mougel
*/

/**
* @doc object
* @name panel
* @property {object} volume The volume being displayed.
* @property {string} axis The name of the axis being displayed (xspace, yspace or zspace).
* @property {object} slice The slice currently being displayed.
* @property {object} canvas Reference to the canvas area used for drawing.
* @property {object} context The 2D context of the canvas. 
* @property {object} image_center The **x** and **y** coordinates of the
*   center of the slice currently being displayed.
* @property {number} zoom The current zoom level of the panel. 
* @property {object} cursor The current **x** and **y** coordinates of the cursor. 
* @property {object} mouse The current **x** and **y** coordinates of the mouse. 
* @description
* Object representing an individual canvas panel.
*/
(function() {
  "use strict";

  /**
  * @doc function
  * @name VolumeViewer.static methods:createPanel
  * @param {object} options Options used to create the panel.
  *  Options can include:
  *
  * * **volume** The volume being displayed on the panel.
  * * **volume_id** The ID of the volume being displayed on the panel.
  * * **axis** The axis being displayed on the panel (xspace, yspace or zspace).
  * * **canvas** The canvas on which to draw slices.
  * * **image_center** An object containing the starting **x** and **y** positions of 
  *     the slice image center.
  * * **updated** Boolean value indicating whether the panel should be redrawn.
  *
  * @returns {object} Panel object used to control display of a slice.
  * @description
  * Factory function to produce the panel object used to control the 
  * display of a slice.
  * ```js
  * BrainBrowser.VolumeViewer.createPanel({
  *   volume: volume,
  *   axis: "xspace",
  *   canvas: canvas,
  *   image_center: {
  *     x: canvas.width / 2,
  *     y: canvas.height / 2
  *   }
  * });
  * ```
  * Handlers can be attached to the  **panel** object to listen
  * for certain events occuring over the panel's lifetime. Currently, the
  * following panel events can be listened for:
  *
  * * **sliceupdate** The slice being displayed has been updated.
  * * **cursorupdate** The cursor has moved.
  * * **zoom** The zoom level has changed on the panel.
  * * **draw** The panel is being re-drawn.
  *
  * To listen for an event, simply use the viewer's **addEventListener()** method with
  * with the event name and a callback funtion:
  *
  * ```js
  *    viewer.addEventListener("sliceupdate", function() {
  *      console.log("Slice updated!");
  *    });
  *
  * ```
  */
  /**
  * @doc object
  * @name VolumeViewer.Panel Events:sliceupdate
  *
  * @description
  * Triggered when the slice being displayed is updated. 
  * The following information will be passed in the event object:
  *
  * * **event.volume**: the volume on which the slice was updated.
  * * **event.slice**: the new slice.
  *
  * ```js
  *    panel.addEventListener("sliceupdate", function(event) {
  *      console.log("New slice!");
  *    });
  * ```
  */
  /**
  * @doc object
  * @name VolumeViewer.Panel Events:cursorupdate
  *
  * @description
  * Triggered when the user changes the cursor's position in the panel.
  * The following information will be passed in the event object:
  *
  * * **event.volume**: the volume for which the cursor moved.
  * * **event.cursor**: an object representing the cursor position.
  *
  * ```js
  *    panel.addEventListener("cursorupdate", function(event) {
  *      console.log("New cursor position:", event.cursor.x, event.cursor.y);
  *    });
  * ```
  */
  /**
  * @doc object
  * @name VolumeViewer.Panel Events:zoom
  *
  * @description
  * Triggered when the user changes the zoom level of the panel (scroll or touch events).
  * The following information will be passed in the event object:
  *
  * * **event.volume**: the volume on which the slice was updated.
  * * **event.zoom**: the new zoom level.
  *
  * ```js
  *    panel.addEventListener("zoom", function(event) {
  *      console.log("New zoom level:", event.zoom);
  *    });
  * ```
  */
  /**
  * @doc object
  * @name VolumeViewer.Panel Events:draw
  *
  * @description
  * Triggered when the panel is redrawn.
  * The following information will be passed in the event object:
  *
  * * **event.canvas**: the panel drawing canvas.
  * * **event.context**: the panel canvas 2D drawing context.
  * * **event.volume**: the volume on which the slice was updated.
  * * **event.cursor**: an object representing the cursor position.
  *
  * ```js
  *    panel.addEventListener("draw", function(event) {
  *      console.log("Panel refresh!");
  *    });
  * ```
  */
  BrainBrowser.VolumeViewer.createPanel = function(options) {

    options = options || {};

    var old_zoom_level = 0;
    
    // Where the cursor used to be.
    var old_cursor_position = {
      x: 0,
      y: 0
    };

    // Where the mouse or touch used to be.
    var old_pointer_position = {
      x: 0,
      y: 0
    };

    var update_timeout = null;

    // Because slice updates can be interrupted, keep
    // callbacks in an array to be executed at the end.
    var update_callbacks = [];

    var panel = {
      image_translate: {
        x: 0,
        y: 0
      },
      zoom: 1,
      contrast: 1,
      brightness: 0,
      updated: true,
      draw_cursor : true,
      cursor_size : 0,
      view_description: options.view_description,
      smooth_image: true,
      /**
      * @doc function
      * @name panel.panel:setSize
      * @param {number} width Width of the panel canvas.
      * @param {number} height Height of the panel canvas.
      * @description
      * Set the size of the panel canvas.
      * ```js
      * panel.setSize(512, 512);
      * ```
      */
      setSize: function(width, height, options) {
        options = options || {};
        width = width > 0 ? width : 0;
        height = height > 0 ? height : 0;

        if(panel.canvas_layers){
          for(var i = 0; i < panel.canvas_layers.length; i++){
            var canvas_layer = panel.canvas_layers[i].canvas;
            canvas_layer.width = width;
            canvas_layer.height = height;
          }
        }

        panel.canvas = panel.canvas_layers[panel.canvas_layers.length - 1].canvas;

        if(options.scale_image){
          panel.image_translate.x = panel.canvas.width/2;
          panel.image_translate.y = panel.canvas.height/2;
          panel.zoom = Math.min((panel.canvas.width/(panel.slice.width_space.space_length*panel.slice.width_space.step)), panel.canvas.height/(panel.slice.height_space.space_length*panel.slice.height_space.step));
        }

        panel.updated = true;
      },

      /**
      * @doc function
      * @name panel.panel:followPointer
      * @param {object} pointer The pointer to follow.
      * @returns {object} Object containing properties **dx** and **dy** indicating
      * how much the image moved.
      *
      * @description
      * Will translate the image by the same amount that the pointer has moved since
      * this method was last called.
      * ```js
      * panel.followPointer({
      *   x: 100,
      *   y: 125
      * });
      * ```
      */

      followPointer: function(pointer) {
        var dx = pointer.x - old_pointer_position.x;
        var dy = pointer.y - old_pointer_position.y;

        old_pointer_position.x = pointer.x;
        old_pointer_position.y = pointer.y;

        return {
          dx: dx,
          dy: dy
        };
      },

      /**
      * @doc function
      * @name panel.panel:translateImage
      * @param {number} dx The **x** component of the translation vector.
      * @param {number} dy The **y** component of the translation vector.
      *
      * @description
      * Translates the slice image by **dx** and **dy**.
      * ```js
      * panel.translateImage(10, 40));
      * ```
      */
      translateImage: function(dx, dy) {
        panel.image_translate.x += dx;
        panel.image_translate.y += dy;
        panel.updated = true;

      },

      /**
      * @doc function
      * @name panel.panel:reset
      * @description
      * Reset image to it's original position and zoom level.
      * ```js
      * panel.reset();
      * ```
      */
      reset: function() {
        panel.zoom = 1;
        panel.image_translate.x = panel.canvas.width/2;
        panel.image_translate.y = panel.canvas.height/2;
        panel.updated = true;
      },

      /**
      * @doc function
      * @name panel.panel:getCursorPosition
      * @description
      * Get the current position of the cursor.
      * ```js
      * panel.getCursorPosition();
      * ```
      */
      getCursorPosition: function(x_pos, y_pos) {
        var volume = panel.volume;
        var slice = panel.slice;
        var origin = getDrawingOrigin(panel);
        var x_position = volume.position[slice.width_space.name];
        var y_position = volume.position[slice.height_space.name];

        if(x_pos){
          x_position = x_pos;
        }
        if(y_pos){
          y_position = y_pos;
        }

        return {
          x: (x_position) * Math.abs(slice.width_space.step) + origin.x,
          y: (y_position) * Math.abs(slice.height_space.step) + origin.y
        };
      },

      /**
      * @doc function
      * @name panel.panel:updateVolumePosition
      * @param {number} x The x coordinate of the canvas position.
      * @param {number} y The y coordinate of the canvas position.
      * @description
      * Update the volume position based on the given x and y
      * coordinates on the panel. Can be used without arguments
      * which will update based only on the zoom level.
      * ```js
      * panel.updateVolumePosition(x, y);
      * ```
      */
      updateVolumePosition: function(x, y) {
        
        var volume = panel.volume;

        var slice_xy = panel.getVolumePosition(x, y);

        if(slice_xy){
          volume.position[panel.slice.width_space.name] = Math.floor(slice_xy.slice_x);
          volume.position[panel.slice.height_space.name] = Math.floor(slice_xy.slice_y);

          volume.position_continuous[panel.slice.width_space.name] = slice_xy.slice_x;
          volume.position_continuous[panel.slice.height_space.name] = slice_xy.slice_y;
          panel.updated = true;
        }
        
      },

      /**
      * @doc function
      * @name panel.panel:getVolumePosition
      * @param {number} x The x coordinate of the canvas position.
      * @param {number} y The y coordinate of the canvas position.
      * @description
      * Get the volume position based on the given x and y
      * coordinates on the panel.
      * ```js
      * panel.getVolumePosition(x, y);
      * ```
      */
      getVolumePosition: function(x, y) {

        var origin = getDrawingOrigin(panel);
        var slice = panel.slice;
        var cursor;
        var slice_x, slice_y, step_slice_x, step_slice_y;

        if (x === undefined || y === undefined) {
          cursor = panel.getCursorPosition();
          x = cursor.x;
          y = cursor.y;
        }

        //the current mouse position is translated and scaled to match the transformation
        x = (x - panel.transformation_matrix[4])/panel.transformation_matrix[0];
        y = (y - panel.transformation_matrix[5])/panel.transformation_matrix[3];

        step_slice_x = Math.abs(slice.width_space.step);
        step_slice_y = Math.abs(slice.height_space.step);

        slice_x = (x - origin.x) / step_slice_x;
        slice_y = (y - origin.y) / step_slice_y;

        if(slice_x < 0 || slice_x > slice.width_space.space_length || slice_y < 0 || slice_y > slice.height_space.space_length){
          return null;
        }

        return {
          slice_x : slice_x,
          slice_y : slice_y
        };
        
      },
      /**
      * @doc function
      * @name panel.panel:getVoxelCoordinates
      * @description
      * Get the current voxel coordinates of the volume
      */
      getVoxelCoordinates : function(){
        return {
          i : panel.volume.position[panel.volume.header.order[0]],
          j : panel.volume.position[panel.volume.header.order[1]],
          k : panel.volume.position[panel.volume.header.order[2]]
        };
      },

      /**
      * @doc function
      * @name panel.panel:updateSlice
      * @param {function} callback A callback function to call after
      * the update is complete.
      * @description
      * Update the current slice being drawn based
      * on the current volume position. This function
      * is asynchronous.
      * ```js
      * panel.updateSlice();
      * ```
      */
      updateSlice: function(callback) {
        
        clearTimeout(update_timeout);
        if (BrainBrowser.utils.isFunction(callback)) {
          update_callbacks.push(callback);
        }

        update_timeout = setTimeout(function() {
          var volume = panel.volume;
          var slice = panel.slice;

          panel.triggerEvent("sliceupdate", {
            volume: volume,
            slice: slice
          });

          panel.updated = true;

          update_callbacks.forEach(function(callback) {
            callback(slice);
          });
          update_callbacks.length = 0;

        }, 0);
      },

      /**
      * @doc function
      * @name panel.panel:draw
      * @param {string} cursor_color The color of the cursor.
      * @param {boolean} active Whether this panel is active or not (i.e.
      * highlighted in red).
      * @description
      * Draw the current slice to the canvas.
      * ```js
      * panel.draw();
      * ```
      */
      draw: function(cursor_color, active) {
        var cursor = panel.getCursorPosition();

        if (old_cursor_position.x !== cursor.x || old_cursor_position.y !== cursor.y) {
          old_cursor_position.x = cursor.x;
          old_cursor_position.y = cursor.y;
          panel.updated = true;
          panel.triggerEvent("cursorupdate", {
            volume: panel.volume,
            cursor: cursor
          });
        }

        if (old_zoom_level !== panel.zoom) {
          old_zoom_level = panel.zoom;
          panel.updated = true;
          panel.triggerEvent("zoom", {
            volume: panel.volume,
            zoom: panel.zoom
          });
        }

        if (panel.touches[0]) {
          old_pointer_position.x = panel.touches[0].x;
          old_pointer_position.y = panel.touches[0].y;
        } else {
          old_pointer_position.x = panel.mouse.x;
          old_pointer_position.y = panel.mouse.y;
        }

        if (!panel.updated) {
          return;
        }
        
        var header_axis = panel.volume.header[panel.axis];
        var translate_x = panel.image_translate.x + (header_axis.width_space.start + Math.abs(header_axis.width_space.space_length*header_axis.width_space.step/2))*panel.zoom;
        var translate_y = panel.image_translate.y + (header_axis.height_space.start + Math.abs(header_axis.height_space.space_length*header_axis.height_space.step/2))*panel.zoom;
        var canvas_layer;
        var ctx;

        panel.transformation_matrix = [-panel.zoom, 0, 0, -panel.zoom, translate_x, translate_y];
        
        var params = {
          tm: panel.transformation_matrix,
          width: panel.slice.width_space.space_length,
          width_spacing: Math.abs(panel.slice.width_space.step),
          height: panel.slice.height_space.space_length,
          height_spacing: Math.abs(panel.slice.height_space.step),
          origin: getDrawingOrigin(panel),
          axis: panel.axis,
          cursor_color: cursor_color,
          cursor: cursor
        };
        var i;
        for(i = 0; i < panel.canvas_layers.length; i++){
          canvas_layer = panel.canvas_layers[i];
          ctx = canvas_layer.canvas.getContext("2d");
          ctx.imageSmoothingEnabled = panel.smooth_image;
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas_layer.canvas.width, canvas_layer.canvas.height);
          ctx.restore();
          canvas_layer.draw(canvas_layer.canvas_buffer, ctx, params);
        }
        
        canvas_layer = panel.canvas_layers[0];
        ctx = canvas_layer.canvas.getContext("2d");

        panel.triggerEvent("draw", {
          volume: panel.volume,
          cursor: cursor,
          canvas: canvas_layer,
          context: ctx
        });


        if (active) {
          canvas_layer = panel.canvas_layers[panel.canvas_layers.length - 1];
          ctx = canvas_layer.canvas.getContext("2d");

          var frame_width = 4;
          var half_frame_width = frame_width / 2;

          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.strokeStyle = "#EC2121";
          ctx.lineWidth = frame_width;
          ctx.strokeRect(
            half_frame_width,
            half_frame_width,
            ctx.canvas.width - frame_width,
            ctx.canvas.height - frame_width
          );
          ctx.restore();
        }

        panel.updated = false;
      },

      drawVolumeSlice: function(volume_id, buffer, ctx, params){

        var volume = panel.volume;
        panel.slice = volume.slice(panel.axis);
        ctx.setTransform(params.tm[0], params.tm[1], params.tm[2], params.tm[3], params.tm[4], params.tm[5]);
        
        var slice;
        var image;
        
        if(volume.volumes){
          slice = panel.slice.slice(volume_id, panel.axis);
          image = volume.getSliceImage(volume_id, slice, panel.contrast, panel.brightness);
          ctx.globalAlpha = volume.blend_ratios[volume_id];
        }else{
          slice = panel.slice;
          image = volume.getSliceImage(slice, panel.zoom, panel.contrast, panel.brightness);
        }
        
        if (image) {
          var image_width = slice.width_space.space_length*slice.width_space.step;
          var image_height = slice.height_space.space_length*slice.height_space.step;
          var ctx_buffer = buffer.getContext("2d");
          var origin = {};
          origin.x = slice.width_space.start;
          origin.y = slice.height_space.start;
          ctx_buffer.putImageData(image, 0, 0);
          ctx.imageSmoothingEnabled = panel.smooth_image;
          ctx.drawImage(buffer, origin.x, origin.y, image_width, image_height );
        }
      },

      drawMousePointer : function(cursor_color, coords){
        var canvas = panel.canvas_layers[panel.canvas_layers.length - 1].canvas;
        var ctx = canvas.getContext("2d");

        var params = {
          tm: panel.transformation_matrix,
          cursor_color: cursor_color,
          cursor_coords: coords
        };

        ctx.imageSmoothingEnabled = false;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        panel.drawCursorLayer(undefined, ctx, params);
      },
      setDrawCursor : function(draw){
        panel.draw_cursor = draw;
      },
      setCursorSize : function(size){
        panel.cursor_size = size;
        panel.updated = true;
      },
      drawCursorLayer : function(buffer, ctx, params){
        var tm = params.tm;
        ctx.setTransform(tm[0], tm[1], tm[2], tm[3], tm[4], tm[5]);

        if(panel.view_description){
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          for(var i = 0; i < panel.view_description.length; i++){
            var desc = panel.view_description[i];
            ctx.fillStyle = "rgba(255,255,255,1)";
            ctx.fillText(desc.text, desc.x * ctx.canvas.width, desc.y*ctx.canvas.height);
          }
          ctx.restore();
        }

        drawCursor(panel, params.cursor_color, params.cursor_coords, ctx);
      }

    };

    Object.keys(options).forEach(function(k) {
      if (!BrainBrowser.utils.isFunction(panel[k])) {
        panel[k] = options[k];
      }
    });

    if (panel.volume) {
      setSlice(panel, panel.volume.slice(panel.axis));
    }

    return panel;
  };

  ///////////////////////
  // Private functions
  ///////////////////////

  // Set the volume slice to be rendered on the panel.
  function setSlice(panel, slice) {
    panel.slice = slice;
  }

  // Draw the cursor at its current position on the canvas.
  function drawCursor(panel, color, coords, ctx) {
    
    var context = ctx;
    var cursor;
    var zoom = panel.zoom;
    var x, y;
    var distance;
    var dx, dy;
    var origx, origy;
    var cursor_size = panel.cursor_size;
    var image_translate = panel.image_translate;


    color = color || "#FF0000";

    if(coords){
      cursor = coords;
    }else{
      cursor = panel.getCursorPosition();
    }
    
    context.save();
    
    context.strokeStyle = color;
    context.fillStyle = color;

    x = cursor.x;
    y = cursor.y;

    context.beginPath();

    context.lineWidth = 0.5;
    dx = panel.slice.width_space.step;
    dy = panel.slice.height_space.step;
    
    origx = x - dx*cursor_size;
    origy = y - dy*cursor_size;

    dx += 2*dx*cursor_size;
    dy +=  2*dy*cursor_size;


    context.moveTo(origx, origy);
    context.lineTo(origx + dx, origy);
    context.lineTo(origx + dx, origy + dy);
    context.lineTo(origx, origy + dy);
    context.lineTo(origx, origy);
    context.stroke();
    context.globalAlpha = 0.5;
    context.closePath();

    if (panel.anchor) {
      dx = (panel.anchor.x - cursor.x);
      dy = (panel.anchor.y - cursor.y);
      distance = Math.sqrt(dx * dx + dy * dy);

      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);

      x = x/zoom + image_translate.x;
      y = y/zoom + image_translate.y;

      context.fillText(distance.toFixed(2), x, y);
      context.restore();


      context.lineWidth = 1;
      context.beginPath();
      context.arc(panel.anchor.x, panel.anchor.y, 1, 0, 2 * Math.PI);
      context.fill();
      context.moveTo(panel.anchor.x, panel.anchor.y);
      context.lineTo(cursor.x, cursor.y);
      context.stroke();
      

    }

    context.restore();


  }

  // Get the origin at which slices should be drawn.
  function getDrawingOrigin(panel) {
    var slice = panel.slice;
    var x = slice.width_space.start;
    var y = slice.height_space.start;
    
    return {
      x: x,
      y: y
    };
  }

})();

