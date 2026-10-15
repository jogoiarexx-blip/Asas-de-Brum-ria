import test from 'node:test';import assert from 'node:assert/strict';
import {normalized} from '../src/game/Input.js';
test('teclas Ctrl, Shift, setas e espaço são normalizadas para comandos do jogo',()=>{
  assert.equal(normalized('Control'),'ctrl');assert.equal(normalized('control'),'ctrl');
  assert.equal(normalized('Shift'),'shift');assert.equal(normalized('ArrowUp'),'arrowup');
  assert.equal(normalized(' '),'space');assert.equal(normalized('T'),'t');
});
