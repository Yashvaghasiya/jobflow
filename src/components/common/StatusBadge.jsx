import {Chip} from '@mui/material';
export default function StatusBadge({status}){const s=String(status).toLowerCase();const color=s==='completed'||s==='paid'?'success':s==='in progress'||s==='partially paid'?'primary':s==='overdue'?'error':'default';return <Chip component="span" label={status} size="small" color={color} sx={{fontSize:12,height:26}}/>}
