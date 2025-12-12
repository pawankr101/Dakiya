use std::net::{AddrParseError, IpAddr, SocketAddr};
use std::str::FromStr;

trait Server {
    fn new(ip_addr: IpAddr, port: u16) -> Self;
    fn start(&self);
    fn stop(&self);
}

struct HttpServer {
    socket_addr: SocketAddr

}
impl Server for HttpServer {
    fn new(ip_addr: &str, port: u16) -> Result<Self,  AddrParseError> {
        let ip = IpAddr::from_str(&ip_addr)?;
        Ok(HttpServer { socket_addr: SocketAddr::from((ip, port)) })
    }

    fn start(&self) {

        println!("HTTP Server started");
    }

    fn stop(&self) {
        println!("HTTP Server stopped");
    }
}

fn test() {
    let server = HttpServer::new("127.0.0.1", 8080).unwrap();
    server.start();
}