"""Bounded public HTTP fetch; connect to validated IP to avoid DNS rebinding."""
import http.client
import ipaddress
import socket
import ssl
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit, urljoin

LIMIT = 200_000

def _fetch_direct(url, redirects=4):
    for _ in range(redirects + 1):
        u = urlsplit(url)
        if u.scheme not in ('https', 'http') or not u.hostname or u.username or u.password:
            raise ValueError('Only public HTTP(S) URLs are supported')
        port = u.port or (443 if u.scheme == 'https' else 80)
        if port not in (80, 443):
            raise ValueError('Nonstandard port')
        addresses = socket.getaddrinfo(u.hostname, port, type=socket.SOCK_STREAM)
        if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):
            raise ValueError('Nonpublic destination')
        conn = http.client.HTTPConnection(u.hostname, port, timeout=8)
        try:
            conn.sock = socket.create_connection((addresses[0][4][0], port), timeout=8)
            if u.scheme == 'https':
                conn.sock = ssl.create_default_context().wrap_socket(conn.sock, server_hostname=u.hostname)
            target = u.path or '/'
            if u.query: target += '?' + u.query
            conn.request('GET', target, headers={'User-Agent': 'NOMEN-Scanner/2', 'Accept-Encoding': 'identity'})
            r = conn.getresponse()
            if r.status in (301, 302, 303, 307, 308):
                location = r.getheader('Location')
                if not location: raise IOError('Missing redirect location')
                url = urljoin(url, location)
                continue
            if r.status != 200: raise IOError('HTTP ' + str(r.status))
            if r.getheader('Content-Encoding', 'identity') != 'identity': raise IOError('Unsupported encoding')
            body = r.read(LIMIT + 1)
            if len(body) > LIMIT: raise IOError('Metadata exceeds byte limit')
            return body
        finally:
            conn.close()
    raise IOError('Too many redirects')


def fetch(url, redirects=4):
    """A killable subprocess bounds DNS, TLS, headers, redirects and slow bodies."""
    if not isinstance(url, str) or len(url) > 8192: raise ValueError("URL too long")
    if urlsplit(url).scheme not in ("http", "https"): raise ValueError("Unsupported scheme")
    try:
        result = subprocess.run([sys.executable, str(Path(__file__).resolve()), str(min(redirects, 4))],
                                input=url.encode(), capture_output=True, timeout=20, check=True)
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as error:
        raise IOError("Metadata fetch failed or exceeded total deadline") from error
    if len(result.stdout) > LIMIT: raise IOError("Metadata exceeds byte limit")
    return result.stdout

if __name__ == "__main__":
    try:
        url = sys.stdin.buffer.read(8193).decode()
        if len(url) > 8192: raise ValueError("URL too long")
        sys.stdout.buffer.write(_fetch_direct(url, int(sys.argv[1])))
    except Exception:
        sys.exit(1)
