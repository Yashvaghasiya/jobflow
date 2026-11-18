import {JButton} from '../../ui';
import Modal from './Modal';export default function ConfirmDialog({title='Delete item?',message='This action cannot be undone.',onConfirm,onClose}){return <Modal title={title} onClose={onClose}><p>{message}</p><footer><JButton onClick={onClose}>Cancel</JButton><JButton className="danger-button" onClick={onConfirm}>Delete</JButton></footer></Modal>;}
