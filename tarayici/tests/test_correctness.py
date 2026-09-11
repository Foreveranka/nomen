import sys, unittest, json, tempfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from adim1_uri import coz_adres
import adim2_metadata as meta
from adim4_kategori import klavye_ezmesi, anahtar
from guvenli_http import _fetch_direct as fetch

class ScannerTests(unittest.TestCase):
    def test_malformed_abi_is_unknown_not_empty_metadata(self):
        from adim1_uri import coz_string
        self.assertIsNone(coz_string("0x"))
        self.assertIsNone(coz_string("0x" + "00" * 64))
        self.assertEqual(coz_string("0x" + (32).to_bytes(32, "big").hex() + "00" * 32), "")

    def test_invalid_owner_results_are_not_addresses(self):
        for value in ('0x', None, '0x'+'0'*64, '0x'+'z'*64): self.assertIsNone(coz_adres(value))
        self.assertEqual(coz_adres('0x'+'0'*24+'a'*40), '0x'+'a'*40)
    def test_non_string_required_fields_fail(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(meta, 'KOK', folder):
            r=meta.isle({'id':1,'uri':json.dumps({'type':3,'name':['agent'],'description':{'x':'purpose'}})})
            self.assertEqual(r['durum'], 'eksik_alan')
    def test_services_require_urls_and_strings_work(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(meta,'KOK',folder):
            r=meta.isle({'id':1,'uri':json.dumps({'type':'agent','name':'Alice','description':'Research','services':[{'name':'MCP'},'https://example.org/mcp',{'endpoint':'javascript:alert(1)'}]})})
            self.assertEqual(r['servis'],1)
            self.assertEqual(r['servis_adres'],['https://example.org/mcp'])
            self.assertEqual(len(r['hash']),64)
            self.assertTrue((Path(folder)/'raw'/(r['hash']+'.json')).exists())
    def test_rpc_failure_does_not_become_empty_uri(self):
        self.assertEqual(meta.isle({'id':1,'uri':None})['durum'],'rpc_error')
    def test_hex_in_real_description_is_not_spam(self):
        self.assertFalse(klavye_ezmesi('Research wallet 0x0000000000000000000000000000000000000000 using chain data'))
        self.assertTrue(klavye_ezmesi('test test test test'))
        self.assertNotEqual(anahtar('a'*160+'x'),anahtar('a'*160+'y'))
    def test_internal_destinations_blocked_before_connect(self):
        with patch('socket.getaddrinfo',return_value=[(2,1,6,'',('127.0.0.1',80))]), patch('socket.create_connection') as connect:
            with self.assertRaises(ValueError): fetch('http://example.org')
            connect.assert_not_called()
    def test_adversarial_punctuation_is_bounded(self):
        import time
        start = time.monotonic()
        self.assertFalse(klavye_ezmesi('-'*300+'!'))
        self.assertLess(time.monotonic()-start, 0.1)
    def test_total_deadline_worker_is_killable(self):
        import guvenli_http, subprocess
        with patch('subprocess.run', side_effect=subprocess.TimeoutExpired('worker',20)) as run:
            with self.assertRaises(IOError): guvenli_http.fetch('https://example.org')
            self.assertEqual(run.call_args.kwargs['timeout'],20)
    def test_unsupported_schemes_blocked(self):
        for uri in ('file:///etc/passwd','ftp://example.org','http://user:pass@example.org'):
            with self.assertRaises(ValueError): fetch(uri)

if __name__=='__main__': unittest.main()
