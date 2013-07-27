// xcanvas; XNA fravored html5/canvas-2D action game library

module xcanvas {

  export interface updatable_i {
    update(game_time: game_time_t);
    get_enabled(): boolean;
    get_update_order(): number;
  }

  export interface drawable_i {
    draw(game_time: game_time_t);
    get_enabled(): boolean;
    get_draw_order(): number;
  }

  export class game_time_t {
    private game: game_t;

    constructor(game: game_t) { this.game = game; }

    get start_time() { return this.game.start_time; }

    get elapsed_game_time() { return this.game.target_elapsed_time; }
    get total_game_time() { return this.game.total_game_time; }
    get total_real_time() { return new Date(new Date().getTime() - this.start_time.getTime()); }
  }

  export interface game_component_i { }

  export class game_component implements game_component_i, updatable_i {
    update(game_time: game_time_t) { }
    
    get_enabled() { return this.enabled; }
    
    get_update_order() { return this.update_order; }
    get_draw_order() { return this.draw_order; }

    enabled = true;

    update_order = 0;
    draw_order = 0;
  }

  export class drawable_game_component extends game_component implements drawable_i {
    draw(game_time: game_time_t) { }
  }

  export class game_t {
    components: Array<game_component>;

    get is_fiexed_time_step() { return true; }

    private start_time_: Date;
    private total_game_time_: Date;

    private game_time: game_time_t;

    get start_time() { return this.start_time_; }
    get total_game_time() { return this.total_game_time_; }

    private initialize_timers() {
      this.start_time_ = new Date();
      this.total_game_time_ = new Date(0);
    }

    target_elapsed_time = new Date(1000 / 60);

    get target_frames_per_second() { return 1000 / this.target_elapsed_time.getTime(); }
    set target_frames_per_second(value: number) { this.target_elapsed_time = new Date(1000 / value); }

    run() {
      this.initialize_timers();
      
      this.update();
      setInterval(this.update, this.target_elapsed_time.getTime());
      
      this.draw();
      setInterval(this.draw, this.target_elapsed_time.getTime());
      
      return this;
    }

    update() {
      this.total_game_time_ = new Date(this.total_game_time_.getTime() + this.target_elapsed_time.getTime());
      this.components
        .filter((v)=> v.get_enabled())
        .forEach((v) => v.update(this.game_time));
    }

    draw() {
      this.components
        .filter((v: any) => v.draw instanceof Function)
        .forEach((v: any) => v.draw(this.game_time));
    }
  }

  export class vector2_t {
    constructor(x: number, y: number) { this.x = x; this.y = y; }
    x = 0;
    y = 0;
    add(a: vector2_t) { this.x += a.x; this.y += a.y; }
    sub(a: vector2_t) { this.x -= a.x; this.y -= a.y; }
    mul(a: number) { this.x *= a; this.y *= a; }
    div(a: number) { this.x /= a; this.y /= a; }
    static add(a: vector2_t, b: vector2_t) { return new vector2_t(a.x + b.x, a.y + b.y); }
    static sub(a: vector2_t, b: vector2_t) { return new vector2_t(a.x - b.x, a.y - b.y); }
    static mul(a: vector2_t, b: number) { return new vector2_t(a.x * b, a.y * b); }
    static div(a: vector2_t, b: number) { return new vector2_t(a.x / b, a.y / b); }
    static get zero() { return new vector2_t(0, 0); }
    static get unit() { return new vector2_t(1, 1); }
  }

  export class positioned_object_t extends drawable_game_component {
    position = vector2_t.zero;
  }

  export class velocitied_object_t extends positioned_object_t {
    velocity = vector2_t.zero;
    update(game_time: game_time_t) { this.position.add(vector2_t.mul(this.velocity, game_time.elapsed_game_time.getTime())); }
  }

  export class accelerated_object_t extends velocitied_object_t {
    accelerations: Array<vector2_t>;
    update(game_time: game_time_t) {
      var sum_acceleration = this.accelerations.reduce((p, c) => vector2_t.add(p, c), vector2_t.zero);
      this.velocity.add(vector2_t.mul(sum_acceleration, game_time.elapsed_game_time.getTime()));
    }
  }

}