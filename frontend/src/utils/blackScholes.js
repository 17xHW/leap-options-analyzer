/**
 * Standard Normal cumulative distribution function (CDF)
 * Polynomial approximation
 */
function normCDF(x) {
    if (x === 0) return 0.5;
    const b1 =  0.319381530;
    const b2 = -0.356563782;
    const b3 =  1.781477937;
    const b4 = -1.821255978;
    const b5 =  1.330274429;
    const p  =  0.2316419;
    const c  =  0.39894228;

    let z = Math.abs(x);
    let t = 1.0 / (1.0 + p * z);
    let n = c * Math.exp(-0.5 * z * z);
    let prob = 1.0 - n * ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;

    return x > 0 ? prob : 1.0 - prob;
}

/**
 * Calculate Call Option price using Black-Scholes formula
 * 
 * @param {number} S - Current stock price
 * @param {number} K - Strike price
 * @param {number} t - Time to expiration (in years, e.g. days/365)
 * @param {number} r - Risk-free interest rate (as a decimal, e.g. 0.05 for 5%)
 * @param {number} v - Volatility (as a decimal, e.g. 0.20 for 20%)
 * @returns {number} - Call Option Price
 */
export function bsCallPrice(S, K, t, r, v, q = 0) {
    return bsCallMetrics(S, K, t, r, v, q).price;
}

/**
 * Standard Normal probability density function (PDF)
 */
function normPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculate Call Option price, Intrinsic, Extrinsic, and Greeks
 */
export function bsCallMetrics(S, K, t, r, v, q = 0) {
    S = parseFloat(S);
    K = parseFloat(K);
    t = parseFloat(t);
    r = parseFloat(r);
    v = parseFloat(v);
    q = parseFloat(q);

    let price = 0;
    let intrinsic = Math.max(0, S - K);
    let extrinsic = 0;
    let delta = 0, gamma = 0, theta = 0, vega = 0, rho = 0;

    if (t <= 0) {
        return { price: intrinsic, intrinsic, extrinsic: 0, greeks: { delta: S > K ? 1 : 0, gamma: 0, theta: 0, vega: 0, rho: 0 } };
    }
    
    if (S > 0 && K > 0 && v > 0) {
        const d1 = (Math.log(S / K) + (r - q + (v * v) / 2) * t) / (v * Math.sqrt(t));
        const d2 = d1 - v * Math.sqrt(t);
        const nd1 = normCDF(d1);
        const nd2 = normCDF(d2);
        const npdf = normPDF(d1);
        const eqt = Math.exp(-q * t);
        const ert = Math.exp(-r * t);

        price = S * eqt * nd1 - K * ert * nd2;
        extrinsic = Math.max(0, price - intrinsic);

        delta = eqt * nd1;
        gamma = (eqt * npdf) / (S * v * Math.sqrt(t));
        vega = (S * eqt * npdf * Math.sqrt(t)) / 100; // per 1% vol
        theta = ( -(S * eqt * npdf * v) / (2 * Math.sqrt(t)) + q * S * eqt * nd1 - r * K * ert * nd2 ) / 365; // per 1 day
        rho = (K * t * ert * nd2) / 100; // per 1% rate
    }

    return {
        price,
        intrinsic,
        extrinsic,
        greeks: { delta, gamma, theta, vega, rho }
    };
}

/**
 * Calculate Put Option price using Black-Scholes formula
 */
export function bsPutPrice(S, K, t, r, v, q = 0) {
    return bsPutMetrics(S, K, t, r, v, q).price;
}

/**
 * Calculate Put Option price, Intrinsic, Extrinsic, and Greeks
 */
export function bsPutMetrics(S, K, t, r, v, q = 0) {
    S = parseFloat(S);
    K = parseFloat(K);
    t = parseFloat(t);
    r = parseFloat(r);
    v = parseFloat(v);
    q = parseFloat(q);

    let price = 0;
    let intrinsic = Math.max(0, K - S);
    let extrinsic = 0;
    let delta = 0, gamma = 0, theta = 0, vega = 0, rho = 0;

    if (t <= 0) {
        return { price: intrinsic, intrinsic, extrinsic: 0, greeks: { delta: S < K ? -1 : 0, gamma: 0, theta: 0, vega: 0, rho: 0 } };
    }
    
    if (S > 0 && K > 0 && v > 0) {
        const d1 = (Math.log(S / K) + (r - q + (v * v) / 2) * t) / (v * Math.sqrt(t));
        const d2 = d1 - v * Math.sqrt(t);
        const nd1_neg = normCDF(-d1);
        const nd2_neg = normCDF(-d2);
        const nd1 = normCDF(d1);
        const npdf = normPDF(d1);
        const eqt = Math.exp(-q * t);
        const ert = Math.exp(-r * t);

        price = K * ert * nd2_neg - S * eqt * nd1_neg;
        extrinsic = Math.max(0, price - intrinsic);

        delta = eqt * (nd1 - 1);
        gamma = (eqt * npdf) / (S * v * Math.sqrt(t));
        vega = (S * eqt * npdf * Math.sqrt(t)) / 100; // per 1% vol
        theta = ( -(S * eqt * npdf * v) / (2 * Math.sqrt(t)) - r * K * ert * nd2_neg + q * S * eqt * nd1_neg ) / 365; // per 1 day
        rho = -(K * t * ert * nd2_neg) / 100; // per 1% rate
    }

    return {
        price,
        intrinsic,
        extrinsic,
        greeks: { delta, gamma, theta, vega, rho }
    };
}

