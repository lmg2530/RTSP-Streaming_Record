#!/usr/bin/env coffee

#
# HandBrakeCLI Wrapper
#
class HandBrake

  constructor: ->
    require 'consolable'

  # commands
  command = []

  # handbrake path
  handbrake = 'HandBrakeCLI'

  # handbrake options
  hb_options = {}

  # x264 options
  x264_options = {}

  # log location
  log_locate = './log.txt'

  # set log location
  setLogs: (log_path) ->
    if !log_path or (string log_path).length < 1
      log_path = '/dev/null'
    log_locate = log_path

  # set path for HandBrakeCLI
  setPath: (handbrake_path) ->
    handbrake = handbrake_path

  # set handbrake options
  #   include options parser.
  #   using setFlag or setLong automatically.
  setOpts: (options) ->
    if typeof options isnt 'object'
      console.error 'argument type must be object.'
      process.exit 1

    for key, val of options
      if (String key).length > 1
        @setLong key, val
      else if (String val).length < 1
        @setFlag key
      else
        hb_options[key] = val

  # set non-value handbrake options
  setFlag: (key) ->
    hb_options[key] = null

  # set long-type handbrake options
  setLong: (key, val) ->
    key = key.replace '_', '-'
    if (String val).length > 0
      option = "-#{key}='#{val}'"
    else
      option = "-#{key}"
    hb_options[option] = null

  # set x264 options
  #   if handbrake option 'e' isnt 'x264',
  #   x264 options will be ignored at execute.
  setX264: (options) ->
    for key, val of options
      key = key.replace '_', '-'
      x264_options[key] = val

  execute: ->
    x264_command = []
    if x264_options
      if hb_options.e isnt 'x264'
        console.error 'x264 options ignored, your video codec is NOT x264'
      else
        for key, val of x264_options
          x264_command.push "#{key}=#{val}"
        hb_options['x'] = x264_command.join ':'
    else
      console.info 'no x264 option'

    for key, val of hb_options
      command.push "-#{key}"
      if val isnt null
        command.push val

    command.push "2> #{log_locate}"
    console.info '[loglocate]', log_locate
    console.info '[execute]', handbrake, command.join ' '
    spawn = (require 'child_process').spawn handbrake, command

    spawn.stdout.on 'data', (data) ->
      console.log data.toString()

    spawn.stderr.on 'data', (data) ->
      a = data.toString()
      console.error 'A: ', a

    spawn.on 'exit', (code) ->
      console.info code

exports.HandBrake = HandBrake
