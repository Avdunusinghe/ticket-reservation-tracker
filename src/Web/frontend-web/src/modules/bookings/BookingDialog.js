import React, { useEffect, useState } from 'react'
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap'
import { Formik, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import {
  ROLES,
  TRAIN_AVAILABLE_DAYS,
  TRAIN_PASSENGER_CLASSES,
} from '../../configs/static-configs'
import TrainsAPIService from '../../api-layer/trains'
import Select, { components } from 'react-select'
import { Typeahead } from 'react-bootstrap-typeahead';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead.bs5.css';
import 'react-datepicker/dist/react-datepicker-cssmodules.css';
import MasterDataAPIService from '../../api-layer/master-data'
import ScheduleAPIService from '../../api-layer/schedules'

const BookingDialog = ({ settings, onClose, onSave, callBackData }) => {
  const { openDialog, action, parentData } = settings
  const [data, setData] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [formDataDestination, setFormDataDestination] = useState({});
  const [formDataOrigin, setFormDataOrigin] = useState({});
  const [formDataStartDate, setFormDataStartDate] = useState(new Date());
  const [stations, setStations] = useState([])
  const [isStationsLoading, setStationsLoading] = useState(true);
  const [isScheduleAvailable, setShedulesAvailability] = useState(false);
  const [isSchedulesLoading, setSchedulesLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [formDataselectedPClass, setFormDataSelectedPclass] = useState(1);
  const [selectedTrain, setSelectedTrain] = useState({});

  const handlePClassOnChange = (e) => {
    console.log(e.target.value)
    setFormDataSelectedPclass(e.target.value)
  }

  const handleSelectTime = (e) => {
    setSelectedTrain(e.target.value)
    console.log(e)

  }
  
  const getAllStations = async () => {
    try {
        setStationsLoading(true)
        const stationsRes = await MasterDataAPIService.getAllStationMasterData()
        const _stations = stationsRes.map(station => ({ label: station.name, id: station.id }));
        if (Array.isArray(_stations) && _stations.length > 0) setShedulesAvailability(true)
        setStations(_stations);
    } catch(error) {
        console.log(error)
        setStations([]);
    } finally {
        setStationsLoading(false);
    }
    return stations;
  }

  const checkTrainAvailability = async () => {
    try {
        const reqObj = {
            destinationStationId: formDataDestination[0].id,
            startPointStationId: formDataOrigin[0].id,
            dateTime: formDataStartDate.toLocaleDateString('en-CA'),
            passengerClass: parseInt(formDataselectedPClass),
        }
        setSchedulesLoading(true)
        const _schedules = await ScheduleAPIService.getScheduleTrainsData(reqObj)
        console.log(_schedules)
       setSchedules(_schedules)
    } catch (error) {
        console.log(error)
        setSchedules([])
    } finally {
        setSchedulesLoading(false)
    }
  }

  useEffect(() => {
    getAllStations()
    const getById = async () => {
      setDataLoading(true)
      const response = await TrainsAPIService.getTrainById({
        id: parentData?.id,
      })
      if (response) {
        await setData(response)
        await setDataLoading(false)
      }
      console.log(response)
    }
    if (action === 'edit') {
      getById()
    }
  }, [action])

  const userSchema = Yup.object().shape({
    trainName: Yup.string().required('Name is required'),
    seatCapacity: Yup.number().required('Capacity is required'),
    availableDays: Yup.number().required('Availability is required'),
    passengerClasses: Yup.array()
      .min(1, 'Select at least one class')
      .required('Classes are required'),
  })

  const initialValues = {
    trainName: action === 'add' ? '' : data?.trainName,
    seatCapacity: action === 'add' ? '' : data?.seatCapacity,
    availableDays: action === 'add' ? '' : data?.availableDays,
    passengerClasses: action === 'add' ? [] : data?.passengerClasses || [],
  }

  const handleSubmit = async (formData) => {
    try {
      const passengers = formData.passengerClasses

      const arrayOfPassengers = passengers.map((str) => parseInt(str, 10))
      const payload = {
        id: action === 'edit' ? parentData.id : '',
        trainName: formData.trainName,
        seatCapacity: Number(formData.seatCapacity),
        availableDays: Number(formData.availableDays),
        passengerClasses: arrayOfPassengers,
      }
      const response = await TrainsAPIService.createTrain(payload)
      if (response) {
        console.log(response)
        await callBackData()
        await onClose()
      } else {
        console.log(response)
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <Modal
      show={openDialog}
      onHide={onClose}
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {action === 'edit' ? 'Edit Train' : 'Add Train'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {action === 'edit' && dataLoading ? (
          <center>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </center>
        ) : (
          <Formik
            initialValues={
              action === 'edit'
                ? { ...initialValues, ...parentData }
                : initialValues
            }
            validationSchema={userSchema}
            onSubmit={handleSubmit}
          >
            {({ isValid, handleSubmit, values, setFieldValue }) => (
                
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Destination station*</Form.Label>
                       <Typeahead
                        id="basic-example"
                        onChange={destination => setFormDataDestination(destination)}
                        isLoading={isStationsLoading}
                        disabled={isStationsLoading}
                        options={stations}
                        placeholder="Choose destination"
                        //selected={formDataDestination}
                       />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Origin station*</Form.Label>
                      <Typeahead
                        id="basic-example"
                        onChange={_origin => setFormDataOrigin(_origin)}
                        isLoading={isStationsLoading}
                        disabled={isStationsLoading}
                        options={stations}
                        placeholder="Choose origin station"
                        //selected={formDataOrigin}
                        />
                      <ErrorMessage
                        name="seatCapacity"
                        component="div"
                        className="text-danger"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row style={{ marginTop: '10px' }}>
                  <Col sm={6}>
                    <Form.Group style={{}}>
                      <Form.Label>Passenger class*</Form.Label>
                      <Field
                        onChange={e => setFormDataSelectedPclass(e.target.value)}
                        value={formDataselectedPClass}
                        name="availableDays"
                        as="select"
                        style={{
                          width: '100%',
                          height: '37px',
                          border: '1px solid #dee2e6',
                          borderRadius: '0.375rem',
                        }}
                      >
                        {TRAIN_PASSENGER_CLASSES.map((item, index) => (
                          <option key={index} value={item.id}>
                            {item.name}
                          </option>
                        ))}

                      </Field>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                  <Form.Group style={{}}>
                      <Form.Label>Booking date*</Form.Label>
                      <DatePicker 
                        selected={formDataStartDate} 
                        onChange={(date) => setFormDataStartDate(date)} 
                        minDate={new Date()} 
                        maxDate={new Date().setDate(new Date().getDate() + 30)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '20px',
                  }}
                >
                  <Row>
                    <Col sm={12}>
                      <Button
                        variant="secondary"
                        onClick={checkTrainAvailability}
                        style={{
                          border: 'none',
                          borderRadius: '46px',
                          marginLeft: '10px',
                        }}
                      >
                        Check Availability
                      </Button>
                    </Col>
                  </Row>
                </div>
                {isScheduleAvailable && !isSchedulesLoading && 
                <>
            <Row style={{ marginTop: '10px' }}>
            <Col sm={12}>
              <Form.Group style={{}}>
                <Form.Label>Time*</Form.Label>
                <Field
                  onChange={e => handleSelectTime(e, setFieldValue)}
                  value={selectedTrain.arrivalTime}
                  name="availableDays"
                  as="select"
                  style={{
                    width: '100%',
                    height: '37px',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.375rem',
                  }}
                >
                  {schedules.map((train, index) => (
                    <option key={index} value={JSON.stringify(train)}>
                      {new Date(train.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </option>
                  ))}

                </Field>
              </Form.Group>
            </Col>
            </Row>
            <Row style={{ marginTop: '10px' }}>
            <Col sm={12}>
              <Form.Group style={{}}>
                <Form.Label>Train</Form.Label>

                        <Form.Control value={JSON.parse(selectedTrain).trainName} />
                      {/* </Field> */}
                    
                  
        
              </Form.Group>
            </Col>
            
            </Row>
            <Row style={{ marginTop: '10px' }}>
            <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Passenger count*</Form.Label>
                      <Field name="seatCapacity">
                        {({ field }) => <Form.Control {...field}/>}
                      </Field>
                      <ErrorMessage
                        name="seatCapacity"
                        component="div"
                        className="text-danger"
                      />
                    </Form.Group>
                </Col>
            <Col sm={6}>
              <Form.Group style={{}}>
                <Form.Label>Price</Form.Label>
   
                    <Field name="trainName" value={selectedTrain.trainName || "cat"}>
                        {({ field }) => <Form.Control value={selectedTrain.trainName || "cat"} {...field} />}
                      </Field>
                  
        
              </Form.Group>
            </Col>
            </Row>
            </>
                }
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '20px',
                  }}
                >
                  <Row>
                    <Col sm={6}>
                      <Button
                        variant="secondary"
                        onClick={onClose}
                        style={{
                          border: 'none',
                          borderRadius: '46px',
                          marginLeft: '10px',
                        }}
                      >
                        Cancel
                      </Button>
                    </Col>
                    <Col sm={6}>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={!isValid}
                        style={{
                          backgroundColor: '#8428E2',
                          border: 'none',
                          borderRadius: '46px',
                        }}
                      >
                        Save
                      </Button>
                    </Col>
                  </Row>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default BookingDialog
