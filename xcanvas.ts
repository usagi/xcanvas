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

}