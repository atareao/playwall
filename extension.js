/*
 * Copyright (c) 2022 Lorenzo Carbonell <a.k.a. atareao>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const {Clutter, ClutterGst, Gio, St} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const PlayWallButton = Extension.imports.panelbutton.PlayWallButton;

const BackgroundManager = imports.ui.background.BackgroundManager;
const Main = imports.ui.main;
const Overview = imports.ui.overview.Overview;
const Tweener = imports.ui.tweener;

const Gettext = imports.gettext.domain(Extension.uuid);
const _ = Gettext.gettext;

const PANEL_BUTTON_ID = "playwallbutton;"

const SETTINGS_SELECTED_VIDEO = "selected-video";
const SETTINGS_VOLUME = "volume";
const SETTINGS_PLAYBACK = "playback";
const SETTINGS_LOOP = "loop";

const SET_BACKGROUND_SCHEMA = "org.gnome.desktop.background";
const SET_BACKGROUND_KEY = "picture-uri";

const SHADE_ANIMATION_TIME = 0.20;

class VideoWallpaper{
    constructor(){
        this._enabled = false;
        this._playwallButton = null;
        this._video = null;
        this._eosSignal = null;
        this._settings = null;
        this._onSettingsChangedId = null;

        this._stage = null;
        this._video_store = null;
        this._selected_video = null;
        this._volume = 0;
        this._playback = false;
        this._loop = false;
    }

    _loadPreferences(){
        this._selected_video = this._settings.get_string(SETTINGS_SELECTED_VIDEO);
        this._playback = this._settings.get_boolean(SETTINGS_PLAYBACK);
        this._volume = this._settings.get_int(SETTINGS_VOLUME);
        this._loop = this._settings.get_boolean(SETTINGS_LOOP);
    }

    enable(){
        this._enabled = true;
        if(this._video == null){
            ClutterGst.init(null);
            this._video = new ClutterGst.VideoTexture({syncSize: false});
            this._video.set_size(1, 1);
            this._video.set_position(-1, -1);
            this._video.set_opacity(0);
            Main.layoutManager.uiGroup.add_actor(this._video);
        }
        if(this._settings == null){
            this._settings = ExtensionUtils.getSettings();
            this._onSettingsChangedId = this._settings.connect("changed", ()=>{
                this._loadPreferences();
            });
        }

        if(this._playwallButton == null){
            this._playwallButton = new PlayWallButton(this);
            Main.panel.addToStatusArea(PANEL_BUTTON_ID, this._playwallButton);
        }

        if(this._eosSignal == null){
            this._eosSignal = this._video.connect("eos", ()=>{
                if(this._loop){
                    this._video.set_playing(true);
                }else{
                    this.playback = false;
                }
            });
        }

        Overview.prototype._videoWallpaper = this;
        Overview.prototype._unshadeBackgroundsOrig = Overview.prototype._unshadeBackgrounds;
        Overview.prototype._unshadeBackgrounds = function() {
            if(!this._videoWallpaper.playback) {
                this._unshadeBackgroundsOrig();
                return;
            }

            let backgrounds = this._backgroundGroup.get_children();
            Tweener.addTween(backgrounds[backgrounds.length - 1],
                                { opacity: 0,
                                  time: SHADE_ANIMATION_TIME
                                });
            this._unshadeBackgroundsOrig();
        };

        Overview.prototype._shadeBackgroundsOrig = Overview.prototype._shadeBackgrounds;
        Overview.prototype._shadeBackgrounds = function() {
            if(!this._videoWallpaper.playback) {
                this._shadeBackgroundsOrig();
                return;
            }

            let backgrounds = this._backgroundGroup.get_children();
            Tweener.addTween(backgrounds[backgrounds.length - 1],
                                {
                                  opacity: 128,
                                  time: SHADE_ANIMATION_TIME
                                });
            this._shadeBackgroundsOrig();
        };

        BackgroundManager.prototype._videoWallpaper = this;
        BackgroundManager.prototype._clone = null;
        BackgroundManager.prototype._createBackgroundActorOrig = BackgroundManager.prototype._createBackgroundActor;
        BackgroundManager.prototype._createBackgroundActor = function() {
            let background = this._createBackgroundActorOrig();

            if(!this._videoWallpaper.playback || !this._videoWallpaper.enabled) {
                if(this._clone != null) {
                    this._clone.set_opacity(0);
                }
                return background;
            }

            let monitor = this._layoutManager.monitors[this._monitorIndex];
            let first = this._container.get_first_child();

            this._clone = new Clutter.Clone();
            this._clone.set_source(this._videoWallpaper.video);
            this._clone.set_size(monitor.width, monitor.height);

            this._container.remove_all_children();
            this._container.add_actor(this._clone);

            if(first != null && first.background != null) {
                first.background.set_filename('/usr/share/gnome-control-center/pixmaps/noise-texture-light.png', first.background._delegate._style);
                first.set_opacity(0);
                this._container.add_actor(first);
            }

            return background;
        };
        this._recreateBackgroundActors();
        this._video.set_playing(this._playback);
    }

    disable(){
        this._enabled = false;
        this._video.set_playing(false);
        this._recreateBackgroundActors();

        if(typeof Overview.prototype._unshadeBackgroundsOrig === "function") {
            Overview.prototype._unshadeBackgrounds = Overview.prototype._unshadeBackgroundsOrig;
            Overview.prototype._unshadeBackgroundsOrig = undefined;
        }
        if(typeof Overview.prototype._shadeBackgroundsOrig === "function") {
            Overview.prototype._shadeBackgrounds = Overview.prototype._shadeBackgroundsOrig;
            Overview.prototype._shadeBackgroundsOrig = undefined;
        }
        if(typeof BackgroundManager.prototype._createBackgroundActorOrig === "function") {
            BackgroundManager.prototype._createBackgroundActor = BackgroundManager.prototype._createBackgroundActorOrig;
            BackgroundManager.prototype._createBackgroundActorOrig = undefined;
        }

        if(this._playwallButton != null){
            this._playwallButton.destroy();
            this._playwallButton = null;
        }

        if(this._eosSignal != null) {
            this._video.disconnect(this._eosSignal);
            this._eosSignal = null;
        }

        if(this._onSettingsChangedId != null) {
            this._settings.disconnect(this._onSettingsChangedId);
            this._onSettingsChangedId = null;
        }
    }

    _recreateBackgroundActors(){
        Main.overview.hide();
        let background_schema = new Gio.Settings({schema: SET_BACKGROUND_SCHEMA});
        background_schema.set_string(SET_BACKGROUND_KEY, background_schema.get_string(SET_BACKGROUND_KEY));
    }

    get enabled() {
        return this._enabled;
    }

    get video() {
        return this._video;
    }

    get selected_video () {
        return this._selected_video;
    }

    set selected_video (value) {
        if(value != this._selected_video){
            this._selected_video = value;

            this._settings.set_string(SETTINGS_SELECTED_VIDEO, value);
            let file = Gio.File.new_for_uri(value);
            if(file.get_uri_scheme() == null){
                file = Gio.File.new_for_path(value);
            }
            this._video.set_uri(file.get_uri());
            this._video.set_audio_volume(this._volume / 100);
            this._video.set_playing(this._playback);
        }
    }

    get volume () {
        return this._volume;
    }

    set volume(value){
        if(value != this._volume){
            this._volume = value;
            this._settings.set_int(SETTINGS_VOLUME, value);
            this._video.set_audio_volume(value / 100);
        }
    }

    get playback(){
        return this._playback;
    }

    set playback (value) {
        if(value != this._playback){
            this._playback = value;
            this._settings.set_boolean(SETTINGS_PLAYBACK, value);
            this._video.set_playing(value);
            this._recreateBackgroundActors();
        }
    }

    get loop(){
        return this._loop;
    }

    set loop(value){
        this._loop = value;
        this._settings.set_boolean(SETTINGS_LOOP, value);
    }
}

let videoWallpaper = null;
function init() {
    ExtensionUtils.initTranslations();
}

function enable() {
    videoWallpaper = new VideoWallpaper();
    videoWallpaper.enable();
}

function disable() {
    videoWallpaper.disable();
    videoWallpaper = null;
}
