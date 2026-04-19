from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/price")
def get_price(ticker: str):
    try:
        t = yf.Ticker(ticker.upper())
        # To get the fastest live price:
        # History with period 1d usually gives current price even pre/post market safely
        hist = t.history(period="1d", auto_adjust=False)
        if not hist.empty:
            price = float(hist["Close"].iloc[-1])
            return {"ticker": ticker.upper(), "price": price}
        
        # Fallback to info (can sometimes be slow or rate limited)
        info = t.info
        if 'currentPrice' in info:
            return {"ticker": ticker.upper(), "price": float(info['currentPrice'])}
        elif 'regularMarketPrice' in info:
            return {"ticker": ticker.upper(), "price": float(info['regularMarketPrice'])}

        return {"error": "Price not found"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # run on port 8001
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
