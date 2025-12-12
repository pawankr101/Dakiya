
use utils::collections::{ArrayList, ListType};

fn main() {
    dak::core::hello_core();
    dak::storage::save_item();
    let list: ListType<i32> = ArrayList::new();
    println!("Hello, world!");
    // This is a simple Rust program that prints "Hello, world!" to the console.
    // You can run this program using `cargo run`.
}
