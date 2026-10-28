const express=require("express")
const router=express.Router();
const routecontroller=require("../controller/route")
import { Routes } from '@angular/router';
import { CommunityComponent } from './community/community.component';

router.get("/routes/:departure/:arrival/:date",
    routecontroller.getoneroute
);
export const routes: Routes = [
  // Keep your existing routes.
  { path: 'community', component: CommunityComponent }
]; 

module.exports=router;