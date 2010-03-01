<%@ page language="java" contentType="text/html" session="false" 
%><%@ taglib uri="http://www.mmbase.org/mmbase-taglib-2.0" prefix="mm" 
%><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
  "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<mm:content expires="120" type="text/html" escaper="none">
<mm:cloud>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="nl">
<head>
  <meta http-equiv="content-type" content="text/html; charset=utf-8" />
  <title>Player</title>
<style type="text/css">
#videodiv
{
	background: #ccc;
	width: 340px;
	padding: 10px;
}
applet
{
	padding: 0;
	margin: 0;
}
</style>
</head>
<body>


<div id="vplayer"><object width="320" height="240" classid="java:com.fluendo.player.Cortado.class" type="application/x-java-applet" archive="cortado-ovt-stripped-wm_r38710.jar"><param name="code" value="com.fluendo.player.Cortado.class"/><param name="archive" value="cortado-ovt-stripped-wm_r38710.jar"/><param name="url" value="matrix.ogg"/><param name="keepAspect" value="true"/><param name="autoPlay" value="true"/><param name="bufferSize" value="4096"/><param name="bufferHigh" value="25"/><param name="bufferLow" value="5"/></object></div>

<mm:node number="media.bril">
  <mm:field name="title" />
  <mm:link page="mediafragment" referids="_node@n">
    <mm:frameworkparam name="component">oip</mm:frameworkparam>
    ${_}
  </mm:link>
</mm:node>

<p>
 Safari ondersteunt ogg niet native, je moet iets installeren, en laat dan dus niets zien 
 (je kan niets beginnen). Safari speelt wel mp4 af in de video-tag.
 Firefox 3 springt meteen van video-tag naar de applet en speelt dan dus de ogg.
</p>

<p>
  D'r moet nog wel fix wat javascript tegenaan om leuke knoppen e.d. te laten werken.
</p>

<p>html5 <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html">http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html</a></p>

<hr />
<!--
<div id="videodiv">      
<video autoplay="true" 
       src="matrix.ogg" 
       controls="true" 
       width="320" 
       height="240"
       autobuffer="true" >
       
  <p>
    This is the Java Cortado Applet version of the video player. 
    For a better playing experience you'll need a browser that 
    can playback Ogg media using &lt;video&gt; and &lt;audio&gt; tags.
  </p>
    
  <applet code="com.fluendo.player.Cortado.class" 
    archive="cortado-ovt-stripped-wm_r38710.jar" height="240" width="320">
    <param name="url" value="matrix.ogg" />
    <param name="BufferSize" value="4096" />
    <param name="BufferHigh" value="25" />
    <param name="BufferLow" value="5" />
    <param name="duration" value="46.654" />
    <param name="autoPlay" value="true" />
    <param name="statusHeight" value="16" />
    <param name="showSpeaker" value="true" />
  </applet>

</video>
</div>
-->
<pre>
parameters for cortado:
-----------

  url:        string
              the URL to load, must be a fully qualified URL.
              IMPORTANT: if the applet is not signed, the hostname of the
              url *is required* to be the same as the hostname of the link
              to the page with the applet tag.  This is a Java security limitation.

  seekable:   enum (auto|true|false)
              Whether or not you can seek in the file.  For live streams,
              this should be false; for on-demand files, this can be true.
	      In automatic mode, the stream becomes seekable when the content
	      length is discovered.
	      Defaults to auto

  live        enum (auto|true|false)
              Whether or not this file is a live stream.  For live streams,
              this should be true, which will disable the PAUSE button.
	      For on-demand files, this can be false.
	      In automatic mode, the stream becomes non-live when the content
	      length is discovered.
	      Defaults to auto

  duration:   int
              Length of clip in seconds.  Needed when seekable is true,
              to allow the seek bar to work.

  keepAspect: boolean
              Try to keep the natural aspect of the video when resizing the
              applet window. true or false.
	      Defaults to true

  ignoreAspect: boolean
              Ignore the aspect ratio as signalled by the video, always assume
              square pixels. true or false.
              Defaults to false

  video:      boolean
              Use video. When not using video, this property will not create
              resources to play a video stream. true or false.
	      Defaults to true
	      
  audio:      boolean
              Use audio. When not using audio, this property will not create
              resources to play an audio stream. true or false.
	      Defaults to true

  kateIndex:  int
              Use text from the given Kate stream (indexed from zero).
              The first Kate stream found will have index 0, the second will
              have index 1, etc.
              At most one Kate stream may be enabled at a time.
	      Defaults to -1 (none)

  statusHeight: int
              The height of the status area (default 12)

  autoPlay:   boolean
              Automatically start playback (default true)

  showStatus: enum (auto|show|hide)
              Controls how to make the status area visible. 
	      auto will show the status area when hovered over with the mouse.
	      hide will only show the status area on error.
	      show will always show the status area.
	      (default auto)

  showSpeaker: boolean
              Show a speaker icon when audio is available (default true)

  hideTimeout: int 
              Timeout in seconds to hide the status area when showStatus is
	      auto. This timeout is to make sure that the status area is visible
	      for the first timeout seconds of playback so that the user can see
	      that there is a clickable status area too.
	      (default 0)

  bufferSize: int
              The size of the network buffer, in KB.
              A good value is max Kbps of the stream * 33
              Defaults to 200

  bufferLow:  int
              Percentage of low watermark for buffer.  Below this, the applet
              will stop playing and rebuffer until the high watermark is
              reached.
              Defaults to 10

  bufferHigh: int
              Percentage of high watermark for buffer.  At startup or when
              rebuffering, the applet will not play until this percentage of
              buffer fill status is reached.
              Defaults to 70

  userId:     string
              user id for basic authentication.

  password:   string
              password for basic authentication.

  debug:      int
              debug level, 0 - 4.  Defaults to 3.  Output goes to the Java
              console.

</pre>


</body>
</html>
</mm:cloud>
</mm:content>
