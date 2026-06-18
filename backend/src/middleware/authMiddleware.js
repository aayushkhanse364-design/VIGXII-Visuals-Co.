import ApiError from '../utils/apiError.js';
import { getFirebaseAdmin } from '../config/firebaseAdmin.js';

function getTokenFromHeader(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice(7);
}

export async function protectAdmin(req, _res, next) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new ApiError(401, 'Missing Firebase token');
    }

    const firebase = getFirebaseAdmin();
    const decodedToken = await firebase.auth().verifyIdToken(token);
    const allowedAdmins = (process.env.ADMIN_EMAILS || process.env.FIREBASE_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    const email = (decodedToken.email || '').toLowerCase();
    const isAdminClaim = decodedToken.admin === true;
    const isAllowedEmail = allowedAdmins.length > 0 && allowedAdmins.includes(email);

    if (!isAdminClaim && !isAllowedEmail) {
      throw new ApiError(403, 'Admin access required');
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid Firebase token'));
  }
}