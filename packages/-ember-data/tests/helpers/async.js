import { all, resolve } from 'rsvp';
import { run } from '@ember/runloop';

export function wait(callback, timeout) {
  let done = this.async();

  let timer = setTimeout(() => {
    this.ok(false, 'Timeout was reached');
    done();
  }, timeout || 200);

  return function() {
    window.clearTimeout(timer);

    let args = arguments;
    let result;
    try {
      result = run(() => callback.apply(this, args));
    } finally {
      done();
    }
    return result;
  };
}
