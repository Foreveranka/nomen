import json,urllib.request
def keccak(b):
    RC=[0x0000000000000001,0x0000000000008082,0x800000000000808A,0x8000000080008000,0x000000000000808B,0x0000000080000001,0x8000000080008081,0x8000000000008009,0x000000000000008A,0x0000000000000088,0x0000000080008009,0x000000008000000A,0x000000008000808B,0x800000000000008B,0x8000000000008089,0x8000000000008003,0x8000000000008002,0x8000000000000080,0x000000000000800A,0x800000008000000A,0x8000000080008081,0x8000000000008080,0x0000000080000001,0x8000000080008008]
    R=[[0,36,3,41,18],[1,44,10,45,2],[62,6,43,15,61],[28,55,25,21,56],[27,20,39,8,14]]
    M=(1<<64)-1
    def rot(x,n): n%=64; return ((x<<n)|(x>>(64-n)))&M
    rate=136; S=[[0]*5 for _ in range(5)]
    P=bytearray(b)+b'\x01'; P+=b'\x00'*((-len(P))%rate); P[-1]|=0x80
    for off in range(0,len(P),rate):
        blk=P[off:off+rate]
        for i in range(rate//8):
            S[i%5][i//5]^=int.from_bytes(blk[i*8:i*8+8],'little')
        for rnd in range(24):
            C=[S[x][0]^S[x][1]^S[x][2]^S[x][3]^S[x][4] for x in range(5)]
            D=[C[(x-1)%5]^rot(C[(x+1)%5],1) for x in range(5)]
            for x in range(5):
                for y in range(5): S[x][y]^=D[x]
            B=[[0]*5 for _ in range(5)]
            for x in range(5):
                for y in range(5): B[y][(2*x+3*y)%5]=rot(S[x][y],R[x][y])
            for x in range(5):
                for y in range(5): S[x][y]=(B[x][y]^((~B[(x+1)%5][y])&B[(x+2)%5][y]))&M
            S[0][0]^=RC[rnd]
    out=b''
    for i in range(4): out+=S[i%5][i//5].to_bytes(8,'little')
    return out
def namehash(ad):
    n=b'\x00'*32
    if ad:
        for p in reversed(ad.split('.')): n=keccak(n+keccak(p.encode()))
    return n
def call(to,data,rpc="https://ethereum-rpc.publicnode.com"):
    p={"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":to,"data":data},"latest"]}
    r=urllib.request.Request(rpc,data=json.dumps(p).encode(),headers={"Content-Type":"application/json","User-Agent":"Mozilla/5.0"})
    return json.load(urllib.request.urlopen(r,timeout=30)).get("result","0x")
if __name__=="__main__":
    import sys
    print("kontrol: keccak('') =",keccak(b'').hex()[:16],"(beklenen c5d2460186f7233c)")
    print("namehash('eth') =",namehash('eth').hex()[:16],"(beklenen 93cdeb708b7545dc)")
    REG="0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"; BASE="0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85"
    for ad in sys.argv[1:] or ["nomen.eth"]:
        etiket=ad.split('.')[0]
        sahip="0x"+call(REG,"0x02571be3"+namehash(ad).hex())[-40:]
        tid=int.from_bytes(keccak(etiket.encode()),'big')
        exp=int(call(BASE,"0xd6e4fa86"+hex(tid)[2:].zfill(64)) or "0x0",16)
        import datetime
        print(f"{ad}: registry sahibi {sahip} | süre bitişi {datetime.datetime.utcfromtimestamp(exp) if exp else 'KAYITSIZ'}")
