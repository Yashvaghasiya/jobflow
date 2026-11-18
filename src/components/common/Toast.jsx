import {Snackbar,SnackbarContent} from '@mui/material';
export default function Toast({message}){return <Snackbar open={!!message} anchorOrigin={{vertical:'bottom',horizontal:'center'}}><SnackbarContent role="status" message={'✓ '+(message||'')} sx={{borderRadius:3,backgroundColor:'#172b4d',boxShadow:1}}/></Snackbar>}
