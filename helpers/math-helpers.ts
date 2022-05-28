import {
  HOURS_IN_ONE_DAY,
  MINUTES_IN_ONE_HOUR,
  SECONDS_IN_ONE_MINUTE,
} from './constants';

export const convertDaysToSeconds = (days: number) =>
  convertMinutesToSeconds(convertHoursToMinutes(convertDaysToHours(days)));

export const convertDaysToMinutes = (days: number) =>
  convertHoursToMinutes(convertDaysToHours(days));

export const convertDaysToHours = (days: number) => days * HOURS_IN_ONE_DAY;

export const convertHoursToSeconds = (hours: number) =>
  convertMinutesToSeconds(convertHoursToMinutes(hours));

export const convertHoursToMinutes = (hours: number) =>
  hours * MINUTES_IN_ONE_HOUR;

export const convertMinutesToSeconds = (minutes: number) =>
  minutes * SECONDS_IN_ONE_MINUTE;
