import { Router } from "express";
import passport from "passport";
import {
  googleCallbackController,
  meController,
  refreshTokenController,
} from "./auth.controller.js";
import { auth } from "../../helpers/auth/access.js";

const router = Router();

/**
 * Paaport hides lots of steps in the OAuth 2.0 flow from the developer.
 * OAuth 2.0 Participants
 *
 * Resource Owner       : The user who clicks "Sign in with Google"
 * Client               : This Express application
 * Authorization Server : Google Accounts (handles login and consent)
 * Resource Server      : Google APIs that provide user information
 *
 * High-level flow:
 *
 * 1. User requests "/google".
 * 2. Passport redirects the user's browser to Google's authorization endpoint.
 * 3. User logs in and grants permission.
 * 4. Google sends an AUTHORIZATION CODE back to "/google/callback".
 * 5. Passport automatically exchanges the authorization code for tokens.
 * 6. Passport automatically uses the access token to retrieve the user's profile.
 * 7. GoogleStrategy verify callback executes.
 * 8. Passport attaches the authenticated user to req.user.
 * 9. googleCallbackController generates this application's JWT and redirects the user.
 */

router.get("/google", (req, res, next) => {
  /**
   * STEP 1
   * ======
   * Resource Owner (User)
   *        ↓
   * Client (Express App)
   *
   * User clicks "Sign in with Google".
   * Browser sends:
   *
   * GET /api/auth/google
   */

  /**
   * STEP 2
   * ======
   * Client (Express App)
   *        ↓
   * Authorization Server (Google)
   *
   * passport.authenticate("google") DOES NOT authenticate yet.
   *
   * It generates a redirect URL similar to:
   *
   * https://accounts.google.com/o/oauth2/v2/auth
   *      ?client_id=...
   *      &redirect_uri=...
   *      &scope=profile email
   *      &response_type=code
   *      &state=/home
   *
   * Important:
   * response_type=code tells Google:
   *
   * "After the user grants permission,
   *  return an Authorization Code."
   */

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,

    /**
     * Optional state value.
     *
     * Used to preserve application state and protect
     * against CSRF attacks.
     *
     * Example:
     * User attempted to access "/dashboard".
     * After login, we can redirect back there.
     */
    state: (req.query.from as string) || "/home",
  })(req, res, next);
});

/**
 * CALLBACK ROUTE
 *
 * Google redirects the user's browser here after
 * authentication and consent.
 *
 * Example:
 *
 * GET /api/auth/google/callback
 *      ?code=4/0AfJoh...
 *      &state=/home
 *
 * The "code" parameter is the Authorization Code.
 */
router.get(
  "/google/callback",

  passport.authenticate("google", {
    session: false,

    /**
     * If authentication fails,
     * redirect the user back to login.
     */
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),

  /**
   * Everything below happens INSIDE passport.authenticate().
   *
   * These steps are hidden by Passport.
   *
   * ----------------------------------------------------------
   * STEP 3
   * ----------------------------------------------------------
   * Resource Owner (User)
   *        ↓
   * Authorization Server (Google)
   *
   * User logs into Google and clicks "Allow".
   *
   * Google generates:
   *
   * AUTHORIZATION CODE
   *
   * Example:
   * 4/0AfJohXnA8f9...
   *
   *
   * ----------------------------------------------------------
   * STEP 4
   * ----------------------------------------------------------
   * Authorization Server (Google)
   *        ↓
   * Client (Express App)
   *
   * Google redirects browser:
   *
   * GET /google/callback
   *      ?code=xxxxxxxx
   *      &state=...
   *
   * This is where the Authorization Code
   * reaches your application.
   *
   *
   * ----------------------------------------------------------
   * STEP 5
   * ----------------------------------------------------------
   * Client (Express App)
   *        ↓
   * Authorization Server (Google)
   *
   * Passport automatically exchanges the
   * Authorization Code for tokens.
   *
   * Internally it sends:
   *
   * POST https://oauth2.googleapis.com/token
   *
   * With:
   *
   * client_id
   * client_secret
   * code
   * redirect_uri
   * grant_type=authorization_code
   *
   * Google responds with:
   *
   * access_token
   * refresh_token (optional)
   * id_token
   *
   *
   * ----------------------------------------------------------
   * STEP 6
   * ----------------------------------------------------------
   * Client (Express App)
   *        ↓
   * Resource Server (Google APIs)
   *
   * Passport automatically uses the
   * access_token to fetch user information.
   *
   * Example:
   *
   * GET /userinfo
   * Authorization: Bearer access_token
   *
   * Google returns:
   *
   * profile.id
   * profile.displayName
   * profile.emails
   * profile.photos
   *
   *
   * ----------------------------------------------------------
   * STEP 7
   * ----------------------------------------------------------
   * Passport executes GoogleStrategy's verify callback:
   *
   * async (
   *   accessToken,
   *   refreshToken,
   *   profile,
   *   done
   * ) => { ... }
   *
   * At this point:
   *
   * ✓ Access Token already obtained
   * ✓ Refresh Token already obtained
   * ✓ User Profile already fetched
   *
   *
   * ----------------------------------------------------------
   * STEP 8
   * ----------------------------------------------------------
   * Verify callback usually:
   *
   * - Finds the user in the database, or
   * - Creates a new user.
   *
   * Example:
   *
   * const user = await findOrCreateGoogleUser(profile);
   * done(null, user);
   *
   *
   * ----------------------------------------------------------
   * STEP 9
   * ----------------------------------------------------------
   * Passport attaches the authenticated user:
   *
   * req.user = user;
   *
   * Then calls next().
   *
   * Control reaches googleCallbackController.
   */
  googleCallbackController,
);

/**
 * googleCallbackController
 * =========================
 *
 * Usually responsible for:
 *
 * 1. Reading req.user.
 * 2. Generating YOUR application's JWT.
 * 3. Redirecting user to frontend.
 *
 * Important:
 *
 * Google Access Token
 *      ≠
 * Your Application JWT
 *
 * Google Access Token:
 * Used to call Google APIs.
 *
 * Your JWT:
 * Used by your frontend to authenticate
 * with your backend.
 */

router.post("/refresh", refreshTokenController);

router.get("/me", auth, meController);

export default router;
