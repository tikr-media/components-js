import type { LocalAudioTrack, LocalVideoTrack, Room } from 'livekit-client';
import { Track } from 'livekit-client';
import { Subject, merge, Observable } from 'obsrvbl';
import log from '../logger';
import { observeParticipantMedia } from '../observables/participant';
import { prefixClass } from '../styles-interface';

export function setupDeviceSelector(kind: MediaDeviceKind, room?: Room) {
  const activeDeviceSubject = new Subject<string | undefined>();

  const activeDeviceObservable = room
    ? merge(
        observeParticipantMedia(room.localParticipant).map((participantMedia) => {
          let localTrack: LocalAudioTrack | LocalVideoTrack | undefined;
          switch (kind) {
            case 'videoinput':
              localTrack = participantMedia.cameraTrack?.track as LocalAudioTrack;
              break;
            case 'audioinput':
              localTrack = participantMedia.microphoneTrack?.track as LocalVideoTrack;
              break;
            default:
              localTrack = undefined;
              break;
          }
          return localTrack?.mediaStreamTrack.getSettings()?.deviceId;
        }),
        activeDeviceSubject,
      )
    : Observable.from(activeDeviceSubject);

  const setActiveMediaDevice = async (id: string) => {
    if (room) {
      log.debug(`Switching active device of kind "${kind}" with id ${id}.`);
      await room.switchActiveDevice(kind, id);
      let actualDeviceId: string | undefined = id;
      if (kind === 'videoinput') {
        actualDeviceId = await room.localParticipant
          .getTrack(Track.Source.Camera)
          ?.track?.getDeviceId();
      } else if (kind === 'audioinput') {
        actualDeviceId = await room.localParticipant
          .getTrack(Track.Source.Microphone)
          ?.track?.getDeviceId();
      }
      if (actualDeviceId !== id && id !== 'default') {
        log.warn(`Failed to select the desired device. Desired: ${id}. Actual: ${actualDeviceId}`);
      }
      activeDeviceSubject.next(id === 'default' ? id : actualDeviceId);
    } else {
      log.debug('Skip the device switch because the room object is not available. ');
      activeDeviceSubject.next(id);
    }
  };
  const className: string = prefixClass('media-device-select');
  return {
    className,
    activeDeviceObservable,
    setActiveMediaDevice,
  };
}
